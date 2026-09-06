import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UserRow } from '../supabase/database.types';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthResponse } from './auth-response.interface';
import { LoginDto } from './login.dto';

// Doctors don't have their own credentials columns; a doctor logs in through
// a `users` row with rol: 'DOCTOR' whose user_name matches their doctors.email.
const DOCTOR_ROLE = 'DOCTOR';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(payload: LoginDto): Promise<AuthResponse> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('id, created_at, user_name, password, rol, application')
      .eq('user_name', payload.user_name)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        `Supabase login failed: ${error.message}`,
      );
    }

    if (!data) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(payload.password, data.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const tokenPayload = await this.buildTokenPayload(data);

    return {
      access_token: await this.jwtService.signAsync(tokenPayload),
      user: true,
      rol: data.rol,
      ...(typeof tokenPayload.doctorId === 'number'
        ? { doctorId: tokenPayload.doctorId }
        : {}),
    };
  }

  private async buildTokenPayload(
    user: UserRow,
  ): Promise<Record<string, unknown>> {
    const payload: Record<string, unknown> = {
      sub: user.id,
      user_name: user.user_name,
      rol: user.rol,
      application: user.application,
    };

    if (user.rol === DOCTOR_ROLE) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { email: user.user_name },
        select: { id: true },
      });

      if (!doctor) {
        throw new UnauthorizedException(
          "This account has the DOCTOR role but is not linked to any doctor record (user_name must match the doctor's email).",
        );
      }

      payload.doctorId = Number(doctor.id);
    }

    return payload;
  }
}