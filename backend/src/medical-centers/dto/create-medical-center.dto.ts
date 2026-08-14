import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMedicalCenterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
