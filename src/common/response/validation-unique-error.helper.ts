import { BadRequestException } from '@nestjs/common';

export function formatValidationErrors(
  errors: Record<string, string>,
): BadRequestException {
  return new BadRequestException({
    message: 'Validation failed',
    errors,
  });
}
