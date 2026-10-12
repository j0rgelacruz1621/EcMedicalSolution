import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RequestUser } from '../auth/current-user.decorator';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { QueryRecipesDto } from './dto/query-recipes.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipesRepository, RecipeWithRelations } from './recipes.repository';

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function fullName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`.trim();
}

function toRecipeResponse(recipe: RecipeWithRelations) {
  return {
    recipe_id: Number(recipe.id),
    patient_id: Number(recipe.patientId),
    doctor_id: Number(recipe.doctorId),
    medical_center_id: recipe.medicalCenterId
      ? Number(recipe.medicalCenterId)
      : null,
    appointment_id: recipe.appointmentId ? Number(recipe.appointmentId) : null,
    issue_date: toDateOnly(recipe.issueDate),
    header_image_url: recipe.headerImageUrl,
    medications: recipe.medications.map((medication) => ({
      drug_name: medication.drugName,
      presentation: medication.presentation,
      dose: medication.dose,
      frequency: medication.frequency,
      duration: medication.duration,
    })),
    additional_instructions: recipe.additionalInstructions,
    status: recipe.status,
    version_type: recipe.versionType,
    supersedes_recipe_id: recipe.supersedesRecipeId
      ? Number(recipe.supersedesRecipeId)
      : null,
    created_at: recipe.createdAt.toISOString(),
    updated_at: recipe.updatedAt.toISOString(),
    patient: {
      id: Number(recipe.patient.id),
      full_name: fullName(recipe.patient),
      national_id: recipe.patient.nationalId,
      age: recipe.patient.age,
    },
    doctor: {
      id: Number(recipe.doctor.id),
      full_name: fullName(recipe.doctor),
      specialty: recipe.doctor.specialty,
    },
  };
}

@Injectable()
export class RecipesService {
  constructor(private readonly recipesRepository: RecipesRepository) {}

  // SA accounts can issue/edit on behalf of any doctor (doctor_id required);
  // a doctor always signs with the doctorId claim from their own JWT.
  private resolveSigningDoctorId(
    requestedDoctorId: number | undefined,
    user: RequestUser,
  ): number {
    if (user.rol === 'SA') {
      if (!requestedDoctorId) {
        throw new BadRequestException('doctor_id is required for SA accounts.');
      }
      return requestedDoctorId;
    }

    if (!user.doctorId) {
      throw new ForbiddenException('Only doctors can issue recipes.');
    }

    if (requestedDoctorId && requestedDoctorId !== user.doctorId) {
      throw new ForbiddenException('You can only issue recipes as yourself.');
    }

    return user.doctorId;
  }

  private async getRecipeOrFail(id: number) {
    const recipe = await this.recipesRepository.findById(BigInt(id));

    if (!recipe) {
      throw new NotFoundException('Recipe not found.');
    }

    return recipe;
  }

  async create(payload: CreateRecipeDto, user: RequestUser) {
    const doctorId = this.resolveSigningDoctorId(payload.doctor_id, user);

    const [patient, doctor, appointment] = await Promise.all([
      this.recipesRepository.findPatientById(BigInt(payload.patient_id)),
      this.recipesRepository.findDoctorById(BigInt(doctorId)),
      payload.appointment_id
        ? this.recipesRepository.findAppointmentById(
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
      ? await this.recipesRepository.findMedicalCenterById(medicalCenterId)
      : null;

    if (payload.medical_center_id && !medicalCenter) {
      throw new BadRequestException(
        'The provided medical_center_id does not exist.',
      );
    }

    // Se guarda una copia del membrete vigente para que el récipe impreso
    // más adelante conserve la identidad gráfica con la que fue emitido.
    const headerImageUrl =
      doctor.headerImageUrl ?? medicalCenter?.headerImageUrl ?? null;

    const recipe = await this.recipesRepository.create({
      patientId: patient.id,
      doctorId: doctor.id,
      medicalCenterId: medicalCenter?.id ?? null,
      appointmentId: appointment?.id ?? null,
      issueDate: payload.issue_date
        ? new Date(`${payload.issue_date}T00:00:00.000Z`)
        : new Date(),
      headerImageUrl,
      additionalInstructions: payload.additional_instructions || null,
      medications: payload.medications,
    });

    return toRecipeResponse(recipe);
  }

  async findByPatient(patientId: number, query: QueryRecipesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const includeHistory = query.include_history ?? false;

    const patient = await this.recipesRepository.findPatientById(
      BigInt(patientId),
    );

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    const [recipes, total] = await Promise.all([
      this.recipesRepository.findManyByPatient(
        patient.id,
        includeHistory,
        (page - 1) * limit,
        limit,
      ),
      this.recipesRepository.countByPatient(patient.id, includeHistory),
    ]);

    return new PaginatedResponseDto(
      recipes.map(toRecipeResponse),
      total,
      page,
      limit,
    );
  }

  async findOne(id: number) {
    return toRecipeResponse(await this.getRecipeOrFail(id));
  }

  async update(id: number, payload: UpdateRecipeDto, user: RequestUser) {
    const current = await this.getRecipeOrFail(id);
    if (user.rol !== 'SA' && user.doctorId !== Number(current.doctorId)) {
      throw new ForbiddenException('You can only edit your own recipes.');
    }

    if (current.status !== 'ACTIVE' || current.versionType !== 'ORIGINAL') {
      throw new ConflictException(
        'Only the current active version of a recipe can be edited.',
      );
    }

    const updated = await this.recipesRepository.replaceWithNewVersion(
      current,
      payload.medications,
      payload.additional_instructions || null,
    );

    if (!updated) {
      throw new ConflictException(
        'The recipe was modified by another request. Reload and try again.',
      );
    }

    return toRecipeResponse(updated);
  }

  // Datos listos para el layout imprimible (header con membrete, cuerpo y footer).
  async getPrintableDocument(id: number) {
    const recipe = await this.getRecipeOrFail(id);
    const { doctor, medicalCenter } = recipe;

    const officeLabel = doctor.office
      ? [
          `Consultorio ${doctor.office.officeNumber}`,
          doctor.office.locationDetails,
        ]
          .filter(Boolean)
          .join(', ')
      : null;

    return {
      recipe: toRecipeResponse(recipe),
      header: {
        image_url:
          recipe.headerImageUrl ??
          doctor.headerImageUrl ??
          medicalCenter?.headerImageUrl ??
          null,
        doctor_name: fullName(doctor),
        specialty: doctor.specialty,
        medical_center_name: medicalCenter?.name ?? null,
      },
      footer: {
        address:
          [officeLabel, medicalCenter?.address].filter(Boolean).join(' · ') ||
          null,
        phones: [doctor.phone, medicalCenter?.phone].filter(
          (phone): phone is string => Boolean(phone),
        ),
        email: doctor.email,
        license_number: doctor.licenseNumber,
        cm_number: doctor.cmNumber,
      },
    };
  }
}
