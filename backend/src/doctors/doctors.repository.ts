import { Injectable } from '@nestjs/common';
import { day_of_week_enum } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

const DAY_OF_WEEK_MAP: Record<string, day_of_week_enum> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

@Injectable()
export class DoctorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyWithSchedules(skip: number, take: number) {
    return this.prisma.doctor.findMany({
      include: { schedules: true },
      orderBy: { id: 'asc' },
      skip,
      take,
    });
  }

  countDoctors() {
    return this.prisma.doctor.count();
  }

  findDoctorByIdWithSchedules(id: bigint) {
    return this.prisma.doctor.findUnique({
      where: { id },
      include: { schedules: true },
    });
  }

  findDoctorById(id: bigint) {
    return this.prisma.doctor.findUnique({ where: { id } });
  }

  findDoctorByUniqueFields(licenseNumber: string, nationalId: string, email: string) {
    return this.prisma.doctor.findFirst({
      where: {
        OR: [
          { licenseNumber },
          { nationalId },
          { email },
        ],
      },
    });
  }

  findOfficeById(officeId: number) {
    return this.prisma.$queryRawUnsafe(
      'SELECT 1 FROM public.offices WHERE id = $1',
      officeId,
    );
  }

  createDoctor(payload: CreateDoctorDto) {
    return this.prisma.doctor.create({
      data: {
        licenseNumber: payload.licenseNumber,
        nationalId: payload.nationalId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        specialty: payload.specialty,
        officeId: payload.officeId !== undefined ? BigInt(payload.officeId) : undefined,
      },
    });
  }

  updateDoctor(id: bigint, payload: UpdateDoctorDto) {
    return this.prisma.doctor.update({
      where: { id },
      data: {
        ...payload,
        officeId:
          payload.officeId === undefined
            ? undefined
            : payload.officeId === null
              ? null
              : BigInt(payload.officeId),
      },
    });
  }

  findSchedulesByDoctorId(doctorId: bigint) {
    return this.prisma.doctorSchedule.findMany({ where: { doctorId } });
  }

  createSchedules(items: Array<{ doctorId: bigint; dayOfWeek: string; startTime: Date; endTime: Date }>) {
    return this.prisma.$transaction(
      items.map((item) =>
        this.prisma.doctorSchedule.create({
          data: {
            doctorId: item.doctorId,
            dayOfWeek: DAY_OF_WEEK_MAP[item.dayOfWeek],
            startTime: item.startTime,
            endTime: item.endTime,
          },
        }),
      ),
    );
  }
}
