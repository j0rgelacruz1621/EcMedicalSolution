import { Prisma } from '@prisma/client';

// Piezas comunes de los documentos clínicos imprimibles (récipes, informes, etc.):
// relaciones a cargar, fechas DATE y armado de header (membrete) y footer.

export const documentPatientSelect = {
  id: true,
  firstName: true,
  lastName: true,
  nationalId: true,
  age: true,
} satisfies Prisma.PatientSelect;

export const documentDoctorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  specialty: true,
  licenseNumber: true,
  cmNumber: true,
  phone: true,
  email: true,
  headerImageUrl: true,
  office: {
    select: {
      officeNumber: true,
      locationDetails: true,
    },
  },
} satisfies Prisma.DoctorSelect;

export const documentMedicalCenterSelect = {
  id: true,
  name: true,
  address: true,
  phone: true,
  headerImageUrl: true,
} satisfies Prisma.MedicalCenterSelect;

type DocumentPatient = Prisma.PatientGetPayload<{
  select: typeof documentPatientSelect;
}>;
type DocumentDoctor = Prisma.DoctorGetPayload<{
  select: typeof documentDoctorSelect;
}>;
type DocumentMedicalCenter = Prisma.MedicalCenterGetPayload<{
  select: typeof documentMedicalCenterSelect;
}>;

// Columnas DATE: Prisma las entrega como medianoche UTC.
export function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function fullName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`.trim();
}

export function toPatientSummary(patient: DocumentPatient) {
  return {
    id: Number(patient.id),
    full_name: fullName(patient),
    national_id: patient.nationalId,
    age: patient.age,
  };
}

export function toDoctorSummary(doctor: DocumentDoctor) {
  return {
    id: Number(doctor.id),
    full_name: fullName(doctor),
    specialty: doctor.specialty,
  };
}

// Membrete vigente al emitir: el del médico tiene prioridad sobre el del centro.
export function resolveLetterhead(
  doctor: { headerImageUrl: string | null },
  medicalCenter: { headerImageUrl: string | null } | null,
) {
  return doctor.headerImageUrl ?? medicalCenter?.headerImageUrl ?? null;
}

export function buildDocumentHeader(
  storedHeaderImageUrl: string | null,
  doctor: DocumentDoctor,
  medicalCenter: DocumentMedicalCenter | null,
) {
  return {
    image_url: storedHeaderImageUrl ?? resolveLetterhead(doctor, medicalCenter),
    doctor_name: fullName(doctor),
    specialty: doctor.specialty,
    medical_center_name: medicalCenter?.name ?? null,
  };
}

export function buildDocumentFooter(
  doctor: DocumentDoctor,
  medicalCenter: DocumentMedicalCenter | null,
) {
  const officeLabel = doctor.office
    ? [
        `Consultorio ${doctor.office.officeNumber}`,
        doctor.office.locationDetails,
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  return {
    address:
      [officeLabel, medicalCenter?.address].filter(Boolean).join(' · ') || null,
    phones: [doctor.phone, medicalCenter?.phone].filter(
      (phone): phone is string => Boolean(phone),
    ),
    email: doctor.email,
    license_number: doctor.licenseNumber,
    cm_number: doctor.cmNumber,
  };
}
