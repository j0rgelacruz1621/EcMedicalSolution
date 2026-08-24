import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { task_status_enum } from '@prisma/client';
import { RequestUser } from '../auth/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TasksRepository } from './tasks.repository';

const TASK_STATUSES: task_status_enum[] = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

function toJsonSafe(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(toJsonSafe);
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        toJsonSafe(nestedValue),
      ]),
    );
  }

  return value;
}

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  // SA accounts (staff admins) can manage any doctor's tasks; a doctor's own
  // JWT `doctorId` claim (set at login from their doctors.email) must
  // otherwise match the doctors.id being accessed/modified.
  private assertDoctorOwnership(doctorId: number, user: RequestUser) {
    if (user.rol === 'SA') {
      return;
    }

    if (user.doctorId !== doctorId) {
      throw new ForbiddenException('You can only manage your own tasks.');
    }
  }

  async create(doctorId: number, payload: CreateTaskDto, user: RequestUser) {
    this.assertDoctorOwnership(doctorId, user);

    const doctor = await this.tasksRepository.findDoctorById(
      BigInt(doctorId),
    );

    if (!doctor) {
      throw new NotFoundException('Doctor not found.');
    }

    const task = await this.tasksRepository.createTask(
      BigInt(doctorId),
      payload,
    );

    return toJsonSafe(task);
  }

  async findAllForDoctor(
    doctorId: number,
    query: QueryTasksDto,
    user: RequestUser,
  ) {
    this.assertDoctorOwnership(doctorId, user);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'due_date';
    const order = query.order ?? 'asc';

    const [tasks, total] = await Promise.all([
      this.tasksRepository.findManyByDoctor(BigInt(doctorId), {
        status: query.status,
        sortBy,
        order,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.tasksRepository.countByDoctor(BigInt(doctorId), query.status),
    ]);

    return {
      data: toJsonSafe(tasks),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getSummary(doctorId: number, user: RequestUser) {
    this.assertDoctorOwnership(doctorId, user);

    const { grouped, urgentPending } = await this.tasksRepository.getSummary(
      BigInt(doctorId),
    );

    const byStatus = Object.fromEntries(
      TASK_STATUSES.map((status) => [status, 0]),
    ) as Record<task_status_enum, number>;

    for (const entry of grouped) {
      if (entry.status) {
        byStatus[entry.status] = entry._count._all;
      }
    }

    return { byStatus, urgentPending };
  }

  async updateStatus(
    id: number,
    payload: UpdateTaskStatusDto,
    user: RequestUser,
  ) {
    const task = await this.tasksRepository.findById(BigInt(id));

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    this.assertDoctorOwnership(Number(task.doctor_id), user);

    const updated = await this.tasksRepository.updateStatus(
      BigInt(id),
      payload.status,
    );

    return toJsonSafe(updated);
  }

  async remove(id: number, user: RequestUser) {
    const task = await this.tasksRepository.findById(BigInt(id));

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    this.assertDoctorOwnership(Number(task.doctor_id), user);

    await this.tasksRepository.deleteTask(BigInt(id));
  }
}
