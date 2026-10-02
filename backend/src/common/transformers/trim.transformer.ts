import { Transform } from 'class-transformer';

// Evita que valores con solo espacios pasen @IsNotEmpty y que "a@b.com " se
// trate como un correo distinto de "a@b.com".
export const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
