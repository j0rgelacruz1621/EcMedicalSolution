// Orden de laboratorio de ejemplo para pruebas (forma de LaboratoryOrderWithRelations).
const date = (value: string) => new Date(`${value}T00:00:00.000Z`);

export function buildOrderFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 12n,
    patientId: 5n,
    doctorId: 3n,
    medicalCenterId: 2n,
    appointmentId: null,
    issueDate: date('2026-10-08'),
    diagnosis: 'Evaluación preventiva anual',
    additionalNotes: 'Ayunar mínimo 8 a 12 horas.',
    headerImageUrl: null,
    status: 'ACTIVE',
    createdAt: new Date('2026-10-08T12:00:00.000Z'),
    updatedAt: new Date('2026-10-08T12:00:00.000Z'),
    patient: {
      id: 5n,
      firstName: 'Ricardo',
      lastName: 'Mendoza',
      nationalId: 'V-12345678',
      age: 54,
    },
    doctor: {
      id: 3n,
      firstName: 'Ana',
      lastName: 'Pérez',
      specialty: 'Medicina Interna',
      licenseNumber: 'MPPS-12345',
      cmNumber: 'CM-6789',
      phone: '0412-0000000',
      email: 'dra.perez@example.com',
      headerImageUrl: null,
      office: { officeNumber: '12', locationDetails: 'Piso 2' },
    },
    medicalCenter: {
      id: 2n,
      name: 'Centro Médico Caracas',
      address: 'Av. Principal de Las Mercedes',
      phone: '0212-0000000',
      headerImageUrl: null,
    },
    catalogTests: [
      {
        testId: 1n,
        categoryId: 2n,
        test: {
          id: 1n,
          internalCode: 'BIO-01',
          name: 'Glicemia en Ayunas',
          loincCode: null,
        },
        category: { id: 2n, name: 'Bioquímica' },
      },
      {
        testId: 3n,
        categoryId: 1n,
        test: {
          id: 3n,
          internalCode: 'HEM-01',
          name: 'Hematología Completa',
          loincCode: '58410-2',
        },
        category: { id: 1n, name: 'Hematología' },
      },
    ],
    customTests: [
      {
        categoryName: 'Inmunología',
        testName: 'Antígeno específico no catalogado',
      },
    ],
    ...overrides,
  };
}
