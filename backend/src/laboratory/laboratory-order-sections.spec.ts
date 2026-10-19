import { groupOrderTestsBySection } from './laboratory-order-sections';

const catalogItem = (category: string, name: string, code: string | null) => ({
  category: { name: category },
  test: { name, internalCode: code },
});

describe('groupOrderTestsBySection', () => {
  it('groups catalog tests by category in request order', () => {
    const sections = groupOrderTestsBySection({
      catalogTests: [
        catalogItem('Bioquímica', 'Glicemia', 'BIO-01'),
        catalogItem('Hematología', 'Hematología Completa', 'HEM-01'),
        catalogItem('Bioquímica', 'Perfil Lipídico', 'BIO-02'),
      ],
      customTests: [],
    } as never);

    expect(sections).toEqual([
      {
        title: 'Bioquímica',
        tests: [
          { name: 'Glicemia', code: 'BIO-01' },
          { name: 'Perfil Lipídico', code: 'BIO-02' },
        ],
      },
      {
        title: 'Hematología',
        tests: [{ name: 'Hematología Completa', code: 'HEM-01' }],
      },
    ]);
  });

  it('merges custom tests into a matching section (case-insensitive) or a new one', () => {
    const sections = groupOrderTestsBySection({
      catalogTests: [catalogItem('Hematología', 'Hematología Completa', null)],
      customTests: [
        { categoryName: 'hematología', testName: 'Frotis especial' },
        { categoryName: 'Inmunología', testName: 'Antígeno no catalogado' },
        { categoryName: null, testName: 'Prueba libre' },
        { categoryName: '  ', testName: 'Otra prueba libre' },
      ],
    } as never);

    expect(sections.map((section) => section.title)).toEqual([
      'Hematología',
      'Inmunología',
      'Otros exámenes',
    ]);
    expect(sections[0].tests.map((test) => test.name)).toEqual([
      'Hematología Completa',
      'Frotis especial',
    ]);
    expect(sections[2].tests.map((test) => test.name)).toEqual([
      'Prueba libre',
      'Otra prueba libre',
    ]);
  });
});
