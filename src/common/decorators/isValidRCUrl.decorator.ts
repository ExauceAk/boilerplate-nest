import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

function isValidS3Url(url: string): boolean {
  const regex = new RegExp(`^https://filestore.s3.amazonaws.com/`);
  return regex.test(url);
}

export function IsValidUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidUrl',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (Array.isArray(value)) {
            return value.every((url: string) => isValidS3Url(url));
          }

          return isValidS3Url(value);
        },
        defaultMessage(args: ValidationArguments) {
          const value = args.value;
          if (Array.isArray(value)) {
            const invalidUrls = value.filter(
              (url: string) => !isValidS3Url(url),
            );
            return `Invalid URLs: ${invalidUrls.join(', ')}`;
          }
          return 'Invalid input';
        },
      },
    });
  };
}
