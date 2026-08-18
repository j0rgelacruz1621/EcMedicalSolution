import { Injectable } from '@nestjs/common';
import { Prisma, task_status_enum } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

interface FindManyOptions {
  status?: task_status_enum;
  sortBy: 'due_date' | 'priority';
  order: 'asc' | 'desc';
  skip: number;
  take: number;
}

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findDoctorById(id: bigint) {
    return this.prisma.doctor.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  createTask(doctorId: bigint, payload: CreateTaskDto) {
    return this.prisma.tasks.create({
      data: {
        doctor_id: doctorId,
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        due_date: payload.due_date ? new Date(payload.due_date) : undefined,
      },
    });
  }

  findManyByDoctor(doctorId: bigint, options: FindManyOptions) {
    const where: Prisma.tasksWhereInput = {
      doctor_id: doctorId,
      ...(options.status ? { status: options.status } : {}),
    };

    return this.prisma.tasks.findMany({
      where,
      orderBy: { [options.sortBy]: options.order },
      skip: options.skip,
      take: options.take,
    });
  }

  countByDoctor(doctorId: bigint, status?: task_status_enum) {
    return this.prisma.tasks.count({
      where: {
        doctor_id: doctorId,
        ...(status ? { status } : {}),
      },
    });
  }

  findById(id: bigint) {
    return this.prisma.tasks.findUnique({ where: { id } });
  }

  updateStatus(id: bigint, status: task_status_enum) {
    return this.prisma.tasks.update({
      where: { id },
      data: { status, updated_at: new Date() },
    });
  }

  deleteTask(id: bigint) {
    return this.prisma.tasks.delete({ where: { id } });
  }

  async getSummary(doctorId: bigint) {
    const [grouped, urgentPending] = await Promise.all([
      this.prisma.tasks.groupBy({
        by: ['status'],
        where: { doctor_id: doctorId },
        _count: { _all: true },
      }),
      this.prisma.tasks.count({
        where: { doctor_id: doctorId, status: 'PENDING', priority: 'URGENT' },
      }),
    ]);

    return { grouped, urgentPending };
  }
}
