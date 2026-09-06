import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  user_name: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  @IsIn(['SA', 'DOCTOR'])
  rol?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  doctor_id?: number;

  @IsOptional()
  @IsString()
  application?: string | null;
}