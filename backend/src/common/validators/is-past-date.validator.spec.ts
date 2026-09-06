import { validate } from 'class-validator';
import { IsPastDate } from './is-past-date.validator';

class Fixture {
  @IsPastDate()
  dateOfBirth: string;
}

describe('IsPastDate', () => {
  const build = (dateOfBirth: string) => {
    const fixture = new Fixture();
    fixture.dateOfBirth = dateOfBirth;
    return fixture;
  };

  it('accepts a date in the past', async () => {
    const errors = await validate(build('1990-05-20'));

    expect(errors).toHaveLength(0);
  });

  it('rejects a date in the future', async () => {
    const futureYear = new Date().getFullYear() + 5;
    const errors = await validate(build(`${futureYear}-01-01`));

    expect(errors).toHaveLength(1);
  });

  it('rejects a value that is not a valid date', async () => {
    const errors = await validate(build('not-a-date'));

    expect(errors).toHaveLength(1);
  });
});
