import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { SafeUserRow } from '../supabase/database.types';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async findAll(): Promise<SafeUserRow[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('id, created_at, user_name, rol, application')
      .order('id', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        `Supabase query failed: ${error.message}`,
      );
    }

    return data ?? [];
  }

  async findOne(id: number): Promise<SafeUserRow> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('id, created_at, user_name, rol, application')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        `Supabase query failed: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException(`User ${id} was not found.`);
    }

    return data;
  }

  async create(payload: CreateUserDto): Promise<SafeUserRow> {
    let userName = payload.user_name;

    if (payload.rol === 'DOCTOR') {
      if (!payload.doctor_id) {
        throw new BadRequestException('A doctor must be selected for a DOCTOR account.');
      }

      const doctor = await this.prisma.doctor.findUnique({
        where: { id: BigInt(payload.doctor_id) },
        select: { email: true },
      });

      if (!doctor) {
        throw new NotFoundException('The selected doctor does not exist.');
      }

      userName = doctor.email;
    }

    const password = await this.hashPassword(payload.password);

    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .insert({
        user_name: userName,
        password,
        rol: payload.rol,
        application: payload.application,
      })
      .select('id, created_at, user_name, rol, application')
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Supabase insert failed: ${error.message}`,
      );
    }

    return data;
  }

  async update(id: number, payload: UpdateUserDto): Promise<SafeUserRow> {
    const updatePayload = {
      ...payload,
      password: payload.password
        ? await this.hashPassword(payload.password)
        : undefined,
    };

    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .update(updatePayload)
      .eq('id', id)
      .select('id, created_at, user_name, rol, application')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        `Supabase update failed: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException(`User ${id} was not found.`);
    }

    return data;
  }

  async delete(id: number): Promise<SafeUserRow> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .delete()
      .eq('id', id)
      .select('id, created_at, user_name, rol, application')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        `Supabase delete failed: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException(`User ${id} was not found.`);
    }

    return data;
  }
}