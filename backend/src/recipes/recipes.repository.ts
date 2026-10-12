import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeMedicationDto } from './dto/recipe-medication.dto';

export const recipeInclude = {
  medications: { orderBy: { sortOrder: 'asc' } },
  patient: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      nationalId: true,
      age: true,
    },
  },
  doctor: {
    select: {
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
    },
  },
  medicalCenter: {
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      headerImageUrl: true,
    },
  },
} satisfies Prisma.RecipeInclude;

export type RecipeWithRelations = Prisma.RecipeGetPayload<{
  include: typeof recipeInclude;
}>;

export interface NewRecipeData {
  patientId: bigint;
  doctorId: bigint;
  medicalCenterId: bigint | null;
  appointmentId: bigint | null;
  issueDate: Date;
  headerImageUrl: string | null;
  additionalInstructions: string | null;
  medications: RecipeMedicationDto[];
  supersedesRecipeId?: bigint;
}

function toMedicationRows(medications: RecipeMedicationDto[]) {
  return medications.map((medication, index) => ({
    drugName: medication.drug_name,
    presentation: medication.presentation || null,
    dose: medication.dose || null,
    frequency: medication.frequency || null,
    duration: medication.duration || null,
    sortOrder: index,
  }));
}

@Injectable()
export class RecipesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPatientById(id: bigint) {
    return this.prisma.patient.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  findDoctorById(id: bigint) {
    return this.prisma.doctor.findUnique({
      where: { id },
      select: {
        id: true,
        headerImageUrl: true,
        office: { select: { medicalCenterId: true } },
      },
    });
  }

  findMedicalCenterById(id: bigint) {
    return this.prisma.medicalCenter.findUnique({
      where: { id },
      select: { id: true, headerImageUrl: true },
    });
  }

  findAppointmentById(id: bigint) {
    return this.prisma.appointment.findUnique({
      where: { id },
      select: { id: true, patientId: true },
    });
  }

  create(data: NewRecipeData) {
    return this.prisma.recipe.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        medicalCenterId: data.medicalCenterId,
        appointmentId: data.appointmentId,
        issueDate: data.issueDate,
        headerImageUrl: data.headerImageUrl,
        additionalInstructions: data.additionalInstructions,
        medications: { create: toMedicationRows(data.medications) },
      },
      include: recipeInclude,
    });
  }

  findById(id: bigint) {
    return this.prisma.recipe.findUnique({
      where: { id },
      include: recipeInclude,
    });
  }

  private buildPatientWhere(
    patientId: bigint,
    includeHistory: boolean,
  ): Prisma.RecipeWhereInput {
    return {
      patientId,
      ...(includeHistory ? {} : { versionType: 'ORIGINAL' }),
    };
  }

  findManyByPatient(
    patientId: bigint,
    includeHistory: boolean,
    skip: number,
    take: number,
  ) {
    return this.prisma.recipe.findMany({
      where: this.buildPatientWhere(patientId, includeHistory),
      include: recipeInclude,
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
      skip,
      take,
    });
  }

  countByPatient(patientId: bigint, includeHistory: boolean) {
    return this.prisma.recipe.count({
      where: this.buildPatientWhere(patientId, includeHistory),
    });
  }

  // Edición con auditoría: la versión vigente queda marcada como EDITED/SUPERSEDED
  // (inmutable) y se crea una nueva fila que apunta a ella. Devuelve null si otra
  // edición concurrente ya reemplazó la versión vigente.
  replaceWithNewVersion(
    current: RecipeWithRelations,
    medications: RecipeMedicationDto[],
    additionalInstructions: string | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.recipe.updateMany({
        where: { id: current.id, status: 'ACTIVE', versionType: 'ORIGINAL' },
        data: { status: 'EDITED', versionType: 'SUPERSEDED' },
      });

      if (count === 0) {
        return null;
      }

      return tx.recipe.create({
        data: {
          patientId: current.patientId,
          doctorId: current.doctorId,
          medicalCenterId: current.medicalCenterId,
          appointmentId: current.appointmentId,
          issueDate: current.issueDate,
          headerImageUrl: current.headerImageUrl,
          additionalInstructions,
          supersedesRecipeId: current.id,
          medications: { create: toMedicationRows(medications) },
        },
        include: recipeInclude,
      });
    });
  }
}
