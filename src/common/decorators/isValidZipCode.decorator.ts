import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsValidZipCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsValidZipCode',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          const zipCodeRegex = /^(\d{5})(-\d{4})?$/;
          return typeof value === 'string' && zipCodeRegex.test(value);
        },
        defaultMessage() {
          return 'Zip code must be a valid 5 or 9 digit US ZIP code';
        },
      },
    });
  };
}
