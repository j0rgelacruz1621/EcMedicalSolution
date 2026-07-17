import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthResponse } from './auth-response.interface';
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
}