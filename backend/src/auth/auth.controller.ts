import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthResponse, SessionResponse } from './auth-response.interface';
import { CurrentUser } from './current-user.decorator';
import type { RequestUser } from './current-user.decorator';
import type { LoginDto } from './login.dto';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login and receive an access token' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['user_name', 'password'],
      properties: {
        user_name: { type: 'string', example: 'Jorge1621' },
        password: { type: 'string', example: '802170300' },
      },
    },
  })
  login(@Body() payload: LoginDto): Promise<AuthResponse> {
    return this.authService.login(payload);
  }

  @Get('session')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Validate the active session and retrieve its role' })
  session(@CurrentUser() user: RequestUser): SessionResponse {
    return {
      active: true,
      user: {
        id: user.sub,
        user_name: (user as RequestUser & { user_name: string }).user_name,
        rol: user.rol ?? null,
        application:
          (user as RequestUser & { application?: string }).application ?? null,
        ...(user.doctorId === undefined ? {} : { doctorId: user.doctorId }),
      },
    };
  }
}