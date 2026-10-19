import { buildOrderFixture } from './laboratory-order.fixture';
import { LaboratoryOrderPdfService } from './laboratory-order-pdf.service';

// PNG 1x1 válido, para probar el membrete con imagen sin red.
const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function pageCount(pdf: Buffer) {
  return (pdf.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length;
}

describe('LaboratoryOrderPdfService', () => {
  const service = new LaboratoryOrderPdfService();

  it('renders a one-page PDF with the text letterhead', async () => {
    const pdf = await service.render(buildOrderFixture() as never);

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(1);
  });

  it('embeds the letterhead image stored in the order', async () => {
    const withoutImage = await service.render(buildOrderFixture() as never);
    const withImage = await service.render(
      buildOrderFixture({ headerImageUrl: PNG_1X1 }) as never,
    );

    expect(withImage.toString('latin1')).toContain('/Subtype /Image');
    expect(withoutImage.toString('latin1')).not.toContain('/Subtype /Image');
  });

  it('falls back to the text letterhead when the image is not usable', async () => {
    const pdf = await service.render(
      buildOrderFixture({
        headerImageUrl: 'ftp://example.com/logo.png',
      }) as never,
    );
    expect(pdf.toString('latin1')).not.toContain('/Subtype /Image');
  });

  it('paginates long orders', async () => {
    const order = buildOrderFixture({
      customTests: Array.from({ length: 80 }, (_, index) => ({
        categoryName: `Sección ${index % 6}`,
        testName: `Examen especial número ${index + 1}`,
      })),
    });

    const pdf = await service.render(order as never);
    expect(pageCount(pdf)).toBeGreaterThan(1);
  });
});
