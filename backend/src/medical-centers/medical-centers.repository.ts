import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicalCenterDto } from './dto/create-medical-center.dto';
import { CreateOfficeDto } from './dto/create-office.dto';

@Injectable()
export class MedicalCentersRepository {
  constructor(private readonly prisma: PrismaService) {}

  createMedicalCenter(payload: CreateMedicalCenterDto) {
    return this.prisma.medicalCenter.create({ data: payload });
  }

  async createOffice(payload: CreateOfficeDto) {
    const medicalCenter = await this.prisma.medicalCenter.findUnique({
      where: { id: BigInt(payload.medicalCenterId) },
      select: { id: true },
    });

    if (!medicalCenter) {
      throw new NotFoundException('Medical center not found.');
    }

    return this.prisma.office.create({
      data: {
        medicalCenterId: medicalCenter.id,
        officeNumber: payload.officeNumber,
        locationDetails: payload.locationDetails,
      },
      include: { medicalCenter: true },
    });
  }
}
