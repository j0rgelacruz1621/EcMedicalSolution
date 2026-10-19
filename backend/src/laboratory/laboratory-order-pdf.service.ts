import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  buildDocumentFooter,
  buildDocumentHeader,
  fullName,
} from '../common/documents/printable-document';
import { loadLetterheadImage } from '../common/documents/letterhead-image';
import { groupOrderTestsBySection } from './laboratory-order-sections';
import { LaboratoryOrderWithRelations } from './laboratory-orders.repository';

const BRAND_COLOR = '#800020';
const TEXT_COLOR = '#1f2328';
const MUTED_COLOR = '#5f6368';
const MARGIN = 50;
const FOOTER_HEIGHT = 46;
const LETTERHEAD_MAX_HEIGHT = 90;
const SIGNATURE_BLOCK_HEIGHT = 90;

const issueDateFormatter = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'long',
  timeZone: 'UTC',
});

// Renderiza la orden de laboratorio como PDF (criterios 3.1–3.3):
// membrete desde BD, datos del paciente, exámenes agrupados por categoría,
// indicaciones pre-analíticas, bloque de firma y pie con datos de contacto.
@Injectable()
export class LaboratoryOrderPdfService {
  async render(order: LaboratoryOrderWithRelations): Promise<Buffer> {
    const header = buildDocumentHeader(
      order.headerImageUrl,
      order.doctor,
      order.medicalCenter,
    );
    const footer = buildDocumentFooter(order.doctor, order.medicalCenter);
    const letterhead = await loadLetterheadImage(header.image_url);

    const doc = new PDFDocument({
      size: 'LETTER',
      margins: {
        top: MARGIN - 10,
        bottom: MARGIN + FOOTER_HEIGHT,
        left: MARGIN,
        right: MARGIN,
      },
      bufferPages: true,
      info: {
        Title: `Orden de laboratorio N° ${order.id}`,
        Author: fullName(order.doctor),
      },
    });

    const chunks: Buffer[] = [];
    const finished = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    this.drawLetterhead(doc, letterhead, header);
    this.drawTitle(doc, order);
    this.drawPatientData(doc, order);
    this.drawSections(doc, order);
    this.drawNotes(doc, order.additionalNotes);
    this.drawSignature(doc, header.doctor_name, footer);
    this.drawFooters(doc, footer);

    doc.end();
    return finished;
  }

  private get contentWidth() {
    return 612 - MARGIN * 2; // ancho de carta (612pt) menos márgenes
  }

  private ensureSpace(doc: PDFKit.PDFDocument, height: number) {
    const limit = doc.page.height - doc.page.margins.bottom;
    if (doc.y + height > limit) {
      doc.addPage();
    }
  }

  private drawRule(doc: PDFKit.PDFDocument) {
    doc
      .moveTo(MARGIN, doc.y)
      .lineTo(MARGIN + this.contentWidth, doc.y)
      .lineWidth(0.8)
      .strokeColor(BRAND_COLOR)
      .stroke();
    doc.moveDown(0.6);
  }

  private drawLetterhead(
    doc: PDFKit.PDFDocument,
    image: Buffer | null,
    header: ReturnType<typeof buildDocumentHeader>,
  ) {
    const top = doc.y;

    if (image) {
      try {
        doc.image(image, MARGIN, top, {
          fit: [this.contentWidth, LETTERHEAD_MAX_HEIGHT],
          align: 'center',
          valign: 'center',
        });
        doc.y = top + LETTERHEAD_MAX_HEIGHT + 8;
        this.drawRule(doc);
        return;
      } catch {
        // Imagen corrupta: se usa el membrete de texto.
        doc.y = top;
      }
    }

    doc
      .fillColor(BRAND_COLOR)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(header.doctor_name, { align: 'center' });
    doc.fillColor(MUTED_COLOR).font('Helvetica').fontSize(10);
    if (header.specialty) {
      doc.text(header.specialty.toUpperCase(), { align: 'center' });
    }
    if (header.medical_center_name) {
      doc.text(header.medical_center_name, { align: 'center' });
    }
    doc.moveDown(0.5);
    this.drawRule(doc);
  }

  private drawTitle(
    doc: PDFKit.PDFDocument,
    order: LaboratoryOrderWithRelations,
  ) {
    doc
      .fillColor(TEXT_COLOR)
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('ORDEN DE LABORATORIO', { align: 'center' });

    if (order.status === 'CANCELLED') {
      doc
        .fillColor('#b42318')
        .fontSize(12)
        .text('ANULADA — SIN VALIDEZ', { align: 'center' });
    }

    doc.moveDown(0.8);
  }

  private labeled(doc: PDFKit.PDFDocument, label: string, value: string) {
    doc
      .fillColor(MUTED_COLOR)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(`${label}: `, { continued: true })
      .fillColor(TEXT_COLOR)
      .font('Helvetica')
      .text(value);
  }

  private drawPatientData(
    doc: PDFKit.PDFDocument,
    order: LaboratoryOrderWithRelations,
  ) {
    const { patient } = order;
    const columnWidth = this.contentWidth / 2;
    const top = doc.y;

    doc.x = MARGIN;
    this.labeled(doc, 'Paciente', fullName(patient));
    this.labeled(doc, 'C.I.', patient.nationalId);
    this.labeled(
      doc,
      'Edad',
      patient.age != null ? `${patient.age} años` : 'Sin registro',
    );
    const leftBottom = doc.y;

    doc.y = top;
    doc.x = MARGIN + columnWidth;
    this.labeled(
      doc,
      'Fecha de emisión',
      issueDateFormatter.format(order.issueDate),
    );
    this.labeled(doc, 'Orden N°', String(order.id));

    doc.x = MARGIN;
    doc.y = Math.max(leftBottom, doc.y);
    doc.moveDown(0.5);

    if (order.diagnosis) {
      this.labeled(doc, 'Diagnóstico', order.diagnosis);
    }

    doc.moveDown(0.6);
    this.drawRule(doc);
  }

  private drawSections(
    doc: PDFKit.PDFDocument,
    order: LaboratoryOrderWithRelations,
  ) {
    doc
      .fillColor(BRAND_COLOR)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('EXÁMENES SOLICITADOS');
    doc.moveDown(0.4);

    for (const section of groupOrderTestsBySection(order)) {
      // Que el título de la sección no quede solo al pie de una página.
      this.ensureSpace(doc, 40);

      const barTop = doc.y;
      doc
        .rect(MARGIN, barTop, this.contentWidth, 18)
        .fillColor('#f6eef0')
        .fill();
      doc
        .fillColor(BRAND_COLOR)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(section.title.toUpperCase(), MARGIN + 6, barTop + 5);
      doc.y = barTop + 22;

      doc.fillColor(TEXT_COLOR).font('Helvetica').fontSize(10);
      for (const test of section.tests) {
        this.ensureSpace(doc, 14);
        doc.text(
          `•  ${test.name}${test.code ? `  (${test.code})` : ''}`,
          MARGIN + 12,
          doc.y,
          {
            width: this.contentWidth - 12,
          },
        );
      }

      doc.x = MARGIN;
      doc.moveDown(0.6);
    }
  }

  private drawNotes(doc: PDFKit.PDFDocument, notes: string | null) {
    if (!notes) {
      return;
    }

    this.ensureSpace(doc, 50);
    doc
      .fillColor(BRAND_COLOR)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('INDICACIONES PRE-ANALÍTICAS', MARGIN);
    doc.moveDown(0.3);
    doc
      .fillColor(TEXT_COLOR)
      .font('Helvetica')
      .fontSize(10)
      .text(notes, { width: this.contentWidth });
    doc.moveDown(0.6);
  }

  private drawSignature(
    doc: PDFKit.PDFDocument,
    doctorName: string,
    footer: ReturnType<typeof buildDocumentFooter>,
  ) {
    this.ensureSpace(doc, SIGNATURE_BLOCK_HEIGHT);

    const lineWidth = 220;
    const lineX = MARGIN + (this.contentWidth - lineWidth) / 2;
    const lineY = doc.y + 45;

    doc
      .moveTo(lineX, lineY)
      .lineTo(lineX + lineWidth, lineY)
      .lineWidth(0.8)
      .strokeColor(TEXT_COLOR)
      .stroke();

    const registry = [
      `Reg. médico ${footer.license_number}`,
      footer.cm_number ? `C.M. ${footer.cm_number}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    doc
      .fillColor(TEXT_COLOR)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(doctorName, lineX, lineY + 5, {
        width: lineWidth,
        align: 'center',
      });
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(MUTED_COLOR)
      .text(registry, { width: lineWidth, align: 'center' })
      .text('Firma y sello', { width: lineWidth, align: 'center' });
    doc.x = MARGIN;
  }

  // Pie en todas las páginas: dirección, teléfonos, correo y paginación.
  private drawFooters(
    doc: PDFKit.PDFDocument,
    footer: ReturnType<typeof buildDocumentFooter>,
  ) {
    const contact = [
      footer.address,
      footer.phones.length ? `Tel. ${footer.phones.join(' / ')}` : null,
      footer.email,
    ]
      .filter(Boolean)
      .join('  ·  ');

    const { start, count } = doc.bufferedPageRange();

    for (let index = start; index < start + count; index++) {
      doc.switchToPage(index);

      // Escribir dentro del margen inferior sin que pdfkit agregue páginas.
      const bottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;

      const top = doc.page.height - MARGIN - 10;
      doc
        .moveTo(MARGIN, top - 6)
        .lineTo(MARGIN + this.contentWidth, top - 6)
        .lineWidth(0.5)
        .strokeColor(BRAND_COLOR)
        .stroke();
      doc
        .fillColor(MUTED_COLOR)
        .font('Helvetica')
        .fontSize(8)
        .text(contact, MARGIN, top, {
          width: this.contentWidth,
          align: 'center',
          lineBreak: true,
        })
        .text(`Página ${index - start + 1} de ${count}`, MARGIN, top + 22, {
          width: this.contentWidth,
          align: 'right',
        });

      doc.page.margins.bottom = bottomMargin;
    }
  }
}
