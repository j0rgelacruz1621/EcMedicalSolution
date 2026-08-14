import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateOfficeDto {
  @IsInt()
  @Min(1)
  medicalCenterId: number;

  @IsString()
  @IsNotEmpty()
  officeNumber: string;

  @IsOptional()
  @IsString()
  locationDetails?: string;
}
