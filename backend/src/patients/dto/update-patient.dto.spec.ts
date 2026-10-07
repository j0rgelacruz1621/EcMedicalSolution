import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdatePatientDto } from './update-patient.dto';

describe('UpdatePatientDto', () => {
  const invalidProperties = async (body: Record<string, unknown>) => {
    const errors = await validate(plainToInstance(UpdatePatientDto, body), {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    return errors.map((error) => error.property);
  };

  it('accepts an empty payload', async () => {
    expect(await invalidProperties({})).toEqual([]);
  });

  it('accepts a single field', async () => {
    expect(await invalidProperties({ phone: '0988888888' })).toEqual([]);
  });

  it('accepts every updatable field', async () => {
    expect(
      await invalidProperties({
        nationalId: '0912345678',
        firstName: 'Maria',
        lastName: 'Lopez',
        email: 'maria@example.com',
        phone: '0999999999',
        gender: 'FEMENINO',
        isActive: false,
        age: 34,
        origin: 'Mérida',
        address: 'Av. Principal',
        assignedDoctorId: 1,
        medicalHistoryNotes: 'Alergia a la penicilina',
        vitals: { bloodPressure: '120/80' },
      }),
    ).toEqual([]);
  });

  it.each([
    ['email', 'maria@'],
    ['gender', 'X'],
    ['age', -1],
    ['age', 121],
    ['age', 3.5],
    ['assignedDoctorId', 0],
    ['isActive', 'yes'],
    ['nationalId', '   '],
    ['firstName', ''],
    ['phone', 12345],
  ])('rejects an invalid %s (%p)', async (field, value) => {
    expect(await invalidProperties({ [field]: value })).toEqual([field]);
  });

  it.each([
    'nationalId',
    'firstName',
    'lastName',
    'email',
    'phone',
    'gender',
    'isActive',
  ])('rejects null for the non-nullable field %s', async (field) => {
    expect(await invalidProperties({ [field]: null })).toEqual([field]);
  });

  it.each([
    'age',
    'origin',
    'address',
    'assignedDoctorId',
    'medicalHistoryNotes',
  ])('accepts null to clear the nullable field %s', async (field) => {
    expect(await invalidProperties({ [field]: null })).toEqual([]);
  });

  it('trims surrounding whitespace from text fields', () => {
    const dto = plainToInstance(UpdatePatientDto, {
      email: ' maria@example.com ',
    });

    expect(dto.email).toBe('maria@example.com');
  });

  it('rejects an invalid vitals block', async () => {
    expect(
      await invalidProperties({ vitals: { bloodPressure: 'alta' } }),
    ).toEqual(['vitals']);
  });

  it('rejects properties that are not part of the contract', async () => {
    expect(await invalidProperties({ id: 99 })).toEqual(['id']);
  });
});
