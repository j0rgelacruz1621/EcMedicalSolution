import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsPastDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPastDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') {
            return false;
          }

          const date = new Date(value);

          return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid date in the past.`;
        },
      },
    });
  };
}
