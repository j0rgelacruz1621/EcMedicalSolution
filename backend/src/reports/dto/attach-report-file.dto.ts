import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AttachReportFileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  file_url: string;
}
