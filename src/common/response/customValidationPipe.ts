import {
  Injectable,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      // Automatically other incoming requests
      transform: true,
      // Strip properties that do not have decorators
      whitelist: true,
      // Throw an error when non-allowlisted values are present
      forbidNonWhitelisted: true,
      // Disable the default error messages
      exceptionFactory: (errors: ValidationError[]) => {
        return new BadRequestException(this.formatErrors(errors));
      },
    });
  }

  private formatErrors(errors: ValidationError[]) {
    const result = {};

    errors.forEach((error) => {
      // `error.constraints` contains the validation messages
      if (error.constraints)
        result[error.property] = Object.values(error.constraints).join(', ');

      // Nested validations (if any)
      if (error.children && error.children.length > 0)
        result[error.property] = this.formatErrors(error.children);
    });

    return {
      message: 'Validation failed',
      errors: result,
    };
  }
}
