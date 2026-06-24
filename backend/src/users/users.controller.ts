import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { SafeUserRow } from '../supabase/database.types';
import type { CreateUserDto } from './create-user.dto';
import type { UpdateUserDto } from './update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Roles('SA')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll(): Promise<SafeUserRow[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one user by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<SafeUserRow> {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['user_name', 'password'],
      properties: {
        user_name: { type: 'string', example: 'Jorge1621' },
        password: { type: 'string', example: '802170300' },
        rol: { type: 'string', nullable: true, example: 'SA' },
        application: {
          type: 'string',
          nullable: true,
          example: 'medicalControl',
        },
      },
    },
  })
  create(@Body() payload: CreateUserDto): Promise<SafeUserRow> {
    return this.usersService.create(payload);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        user_name: { type: 'string', example: 'Jorge1621' },
        password: { type: 'string', example: 'new-password' },
        rol: { type: 'string', nullable: true, example: 'SA' },
        application: {
          type: 'string',
          nullable: true,
          example: 'medicalControl',
        },
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateUserDto,
  ): Promise<SafeUserRow> {
    return this.usersService.update(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  delete(@Param('id', ParseIntPipe) id: number): Promise<SafeUserRow> {
    return this.usersService.delete(id);
  }
}