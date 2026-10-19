import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { medical_report_status_enum, Prisma } from '@prisma/client';
import { RequestUser } from '../auth/current-user.decorator';
import {
  buildDocumentFooter,
  buildDocumentHeader,
  parseDateOnly,
  resolveLetterhead,
  toDateOnly,
  toDoctorSummary,
  toPatientSummary,
} from '../common/documents/printable-document';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CreateMedicalReportDto } from './dto/create-medical-report.dto';
import { QueryMedicalReportsDto } from './dto/query-medical-reports.dto';
import { UpdateMedicalReportDto } from './dto/update-medical-report.dto';
import {
  MedicalReportsRepository,
  MedicalReportWithRelations,
  OPEN_STATUSES,
} from './medical-reports.repository';
import { mergeRestPeriodChanges, resolveRestPeriod } from './rest-period';

const REST_FIELDS = ['rest_start_date', 'rest_end_date', 'rest_days'] as const;

function toDateOrNull(value: Date | null) {
  return value ? toDateOnly(value) : null;
}

function toMedicalReportResponse(report: MedicalReportWithRelations) {
  return {
    id: Number(report.id),
    patient_id: Number(report.patientId),
    doctor_id: Number(report.doctorId),
    medical_center_id: report.medicalCenterId
      ? Number(report.medicalCenterId)
      : null,
    appointment_id: report.appointmentId ? Number(report.appointmentId) : null,
    type: report.type,
    title: report.title,
    description: report.description,
    content: report.content,
    issue_date: toDateOnly(report.issueDate),
    rest_start_date: toDateOrNull(report.restStartDate),
    rest_end_date: toDateOrNull(report.restEndDate),
    rest_days: report.restDays,
    diagnosis_code: report.diagnosisCode,
    diagnosis: report.diagnosis,
    header_image_url: report.headerImageUrl,
    status: report.status,
    created_at: report.createdAt.toISOString(),
    updated_at: report.updatedAt.toISOString(),
    patient: toPatientSummary(report.patient),
    doctor: toDoctorSummary(report.doctor),
  };
}

@Injectable()
export class MedicalReportsService {
  constructor(
    private readonly medicalReportsRepository: MedicalReportsRepository,
  ) {}

  // SA accounts can act on behalf of any doctor; a doctor only with the
  // doctorId claim from their own JWT.
  private assertActsAsDoctor(doctorId: number, user: RequestUser) {
    if (user.rol === 'SA') {
      return;
    }

    if (!user.doctorId || user.doctorId !== doctorId) {
      throw new ForbiddenException(
        'You can only manage medical reports issued by yourself.',
      );
    }
  }

  private async getReportOrFail(id: number) {
    const report = await this.medicalReportsRepository.findById(BigInt(id));

    if (!report) {
      throw new NotFoundException('Medical report not found.');
    }

    return report;
  }

  private assertOpen(report: MedicalReportWithRelations, action: string) {
    if (!OPEN_STATUSES.includes(report.status)) {
      throw new ConflictException(
        `A ${report.status} medical report cannot be ${action}.`,
      );
    }
  }

  async create(payload: CreateMedicalReportDto, user: RequestUser) {
    this.assertActsAsDoctor(payload.doctor_id, user);

    const type = payload.type ?? 'INFORME_MEDICO';
    const restPeriod = resolveRestPeriod(type, payload);

    const [patient, doctor, appointment] = await Promise.all([
      this.medicalReportsRepository.findPatientById(BigInt(payload.patient_id)),
      this.medicalReportsRepository.findDoctorById(BigInt(payload.doctor_id)),
      payload.appointment_id
        ? this.medicalReportsRepository.findAppointmentById(
            BigInt(payload.appointment_id),
          )
        : Promise.resolve(null),
    ]);

    if (!patient) {
      throw new BadRequestException('The provided patient_id does not exist.');
    }

    if (!doctor) {
      throw new BadRequestException('The provided doctor_id does not exist.');
    }

    if (payload.appointment_id) {
      if (!appointment) {
        throw new BadRequestException(
          'The provided appointment_id does not exist.',
        );
      }

      if (appointment.patientId !== patient.id) {
        throw new BadRequestException(
          'The appointment does not belong to the provided patient.',
        );
      }
    }

    const medicalCenterId = payload.medical_center_id
      ? BigInt(payload.medical_center_id)
      : (doctor.office?.medicalCenterId ?? null);

    const medicalCenter = medicalCenterId
      ? await this.medicalReportsRepository.findMedicalCenterById(
          medicalCenterId,
        )
      : null;

    if (payload.medical_center_id && !medicalCenter) {
      throw new BadRequestException(
        'The provided medical_center_id does not exist.',
      );
    }

    const report = await this.medicalReportsRepository.create({
      patientId: patient.id,
      doctorId: doctor.id,
      medicalCenterId: medicalCenter?.id ?? null,
      appointmentId: appointment?.id ?? null,
      type,
      title: payload.title,
      description: payload.description || null,
      content: payload.content,
      issueDate: parseDateOnly(payload.issue_date),
      ...restPeriod,
      diagnosisCode: payload.diagnosis_code || null,
      diagnosis: payload.diagnosis || null,
      // Copia del membrete vigente: las reimpresiones conservan el original.
      headerImageUrl: resolveLetterhead(doctor, medicalCenter),
    });

    return toMedicalReportResponse(report);
  }

  async findByPatient(patientId: number, query: QueryMedicalReportsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (query.startDate && query.endDate && query.startDate > query.endDate) {
      throw new BadRequestException('startDate must be on or before endDate.');
    }

    const patient = await this.medicalReportsRepository.findPatientById(
      BigInt(patientId),
    );

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    const filters = {
      patientId: patient.id,
      type: query.type,
      issuedFrom: query.startDate ? parseDateOnly(query.startDate) : undefined,
      issuedTo: query.endDate ? parseDateOnly(query.endDate) : undefined,
    };

    const [reports, total] = await Promise.all([
      this.medicalReportsRepository.findMany(
        filters,
        (page - 1) * limit,
        limit,
      ),
      this.medicalReportsRepository.count(filters),
    ]);

    return new PaginatedResponseDto(
      reports.map(toMedicalReportResponse),
      total,
      page,
      limit,
    );
  }

  async findOne(id: number) {
    return toMedicalReportResponse(await this.getReportOrFail(id));
  }

  async update(id: number, payload: UpdateMedicalReportDto, user: RequestUser) {
    const providedFields = Object.entries(payload).filter(
      ([, value]) => value !== undefined,
    );

    if (providedFields.length === 0) {
      throw new BadRequestException('No fields to update were provided.');
    }

    const current = await this.getReportOrFail(id);
    this.assertActsAsDoctor(Number(current.doctorId), user);
    this.assertOpen(current, 'modified');

    const data: Prisma.MedicalReportUncheckedUpdateInput = {
      status: 'EDITED',
    };

    if (payload.title !== undefined) data.title = payload.title;
    if (payload.content !== undefined) data.content = payload.content;
    if (payload.description !== undefined) {
      data.description = payload.description || null;
    }
    if (payload.diagnosis_code !== undefined) {
      data.diagnosisCode = payload.diagnosis_code || null;
    }
    if (payload.diagnosis !== undefined) {
      data.diagnosis = payload.diagnosis || null;
    }

    if (REST_FIELDS.some((field) => payload[field] !== undefined)) {
      Object.assign(
        data,
        resolveRestPeriod(
          current.type,
          current.type === 'REPOSO_MEDICO'
            ? mergeRestPeriodChanges(current, payload)
            : payload,
        ),
      );
    }

    const updated = await this.medicalReportsRepository.updateIfStatusIn(
      current.id,
      OPEN_STATUSES,
      data,
    );

    if (!updated) {
      throw new ConflictException(
        'The medical report was signed or cancelled by another request. Reload and try again.',
      );
    }

    return toMedicalReportResponse(updated);
  }

  sign(id: number, user: RequestUser) {
    return this.changeStatus(id, user, 'SIGNED', OPEN_STATUSES, 'signed');
  }

  cancel(id: number, user: RequestUser) {
    return this.changeStatus(
      id,
      user,
      'CANCELLED',
      [...OPEN_STATUSES, 'SIGNED'],
      'cancelled',
    );
  }

  private async changeStatus(
    id: number,
    user: RequestUser,
    status: medical_report_status_enum,
    allowedFrom: medical_report_status_enum[],
    action: string,
  ) {
    const current = await this.getReportOrFail(id);
    this.assertActsAsDoctor(Number(current.doctorId), user);

    if (!allowedFrom.includes(current.status)) {
      throw new ConflictException(
        `A ${current.status} medical report cannot be ${action}.`,
      );
    }

    const updated = await this.medicalReportsRepository.updateIfStatusIn(
      current.id,
      allowedFrom,
      { status },
    );

    if (!updated) {
      throw new ConflictException(
        'The medical report changed status in another request. Reload and try again.',
      );
    }

    return toMedicalReportResponse(updated);
  }

  // Estructura lista para la vista de impresión (header, cuerpo y footer).
  async getPrintableDocument(id: number) {
    const report = await this.getReportOrFail(id);

    return {
      medical_report: toMedicalReportResponse(report),
      header: buildDocumentHeader(
        report.headerImageUrl,
        report.doctor,
        report.medicalCenter,
      ),
      footer: buildDocumentFooter(report.doctor, report.medicalCenter),
    };
  }
}
