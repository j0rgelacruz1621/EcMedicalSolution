import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';

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

  findSchedulesByDoctorId(doctorId: bigint) {
    return this.prisma.doctorSchedule.findMany({ where: { doctorId } });
  }

  createSchedules(items: Array<{ doctorId: bigint; dayOfWeek: string; startTime: Date; endTime: Date }>) {
    return this.prisma.$transaction(
      items.map((item) =>
        this.prisma.doctorSchedule.create({
          data: {
            doctorId: item.doctorId,
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
          },
        }),
      ),
    );
  }
}
