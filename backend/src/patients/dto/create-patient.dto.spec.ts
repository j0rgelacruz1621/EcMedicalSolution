import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePatientDto } from './create-patient.dto';

describe('CreatePatientDto', () => {
  const payload = {
    nationalId: '0912345678',
    firstName: 'Maria',
    lastName: 'Lopez',
    email: 'maria@example.com',
    phone: '0999999999',
    age: 34,
    gender: 'FEMENINO',
  };

  const invalidProperties = async (body: Record<string, unknown>) => {
    const errors = await validate(plainToInstance(CreatePatientDto, body), {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    return errors.map((error) => error.property);
  };

  it('accepts a payload with only the required fields', async () => {
    expect(await invalidProperties(payload)).toEqual([]);
  });

  it('accepts a payload without age', async () => {
    const body: Record<string, unknown> = { ...payload };
    delete body.age;

    expect(await invalidProperties(body)).toEqual([]);
  });

  it('accepts the optional fields', async () => {
    expect(
      await invalidProperties({
        ...payload,
        origin: 'Mérida',
        address: 'Av. Principal',
        medicalHistoryNotes: 'Alergia a la penicilina',
        assignedDoctorId: 1,
        isActive: false,
      }),
    ).toEqual([]);
  });

  it.each(['nationalId', 'firstName', 'lastName', 'email', 'phone', 'gender'])(
    'rejects a payload without %s',
    async (field) => {
      const body: Record<string, unknown> = { ...payload };
      delete body[field];

      expect(await invalidProperties(body)).toEqual([field]);
    },
  );

  it('rejects required text fields that only contain whitespace', async () => {
    expect(
      await invalidProperties({
        ...payload,
        nationalId: '   ',
        firstName: ' ',
      }),
    ).toEqual(['nationalId', 'firstName']);
  });

  it('trims surrounding whitespace from text fields', () => {
    const dto = plainToInstance(CreatePatientDto, {
      ...payload,
      nationalId: ' 0912345678 ',
      email: ' maria@example.com ',
    });

    expect(dto.nationalId).toBe('0912345678');
    expect(dto.email).toBe('maria@example.com');
  });

  it('rejects an email with invalid syntax', async () => {
    expect(await invalidProperties({ ...payload, email: 'maria@' })).toEqual([
      'email',
    ]);
  });

  it('rejects a gender outside the allowed values', async () => {
    expect(await invalidProperties({ ...payload, gender: 'X' })).toEqual([
      'gender',
    ]);
  });

  it.each([-1, 121, 3.5, '34'])('rejects age %p', async (age) => {
    expect(await invalidProperties({ ...payload, age })).toEqual(['age']);
  });

  it.each([0, -3, 1.5, 'abc'])(
    'rejects assignedDoctorId %p',
    async (assignedDoctorId) => {
      expect(await invalidProperties({ ...payload, assignedDoctorId })).toEqual(
        ['assignedDoctorId'],
      );
    },
  );

  it('rejects a non-boolean isActive', async () => {
    expect(await invalidProperties({ ...payload, isActive: 'yes' })).toEqual([
      'isActive',
    ]);
  });

  it('rejects properties that are not part of the contract', async () => {
    expect(await invalidProperties({ ...payload, id: 99 })).toEqual(['id']);
  });
});
