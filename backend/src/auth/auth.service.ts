import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRow } from '../supabase/database.types';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthResponse } from './auth-response.interface';
import { LoginDto } from './login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
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

    return {
      access_token: await this.jwtService.signAsync(this.buildTokenPayload(data)),
      user: true,
    };
  }

  private buildTokenPayload(user: UserRow): Record<string, unknown> {
    return {
      sub: user.id,
      user_name: user.user_name,
      rol: user.rol,
      application: user.application,
    };
  }

}