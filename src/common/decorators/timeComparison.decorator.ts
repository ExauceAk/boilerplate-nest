import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'TimeComparisonValidator', async: false })
export class TimeComparisonValidator implements ValidatorConstraintInterface {
  validate(endTime: Date, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints;
    const startTime = (args.object as any)[relatedPropertyName];

    if (!startTime || !endTime) return true;
    return endTime > startTime;
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'End date time must be greater than start time';
  }
}

@ValidatorConstraint({ name: 'SameDayValidator', async: false })
export class SameDayValidator implements ValidatorConstraintInterface {
  validate(endDateTime: Date, args: ValidationArguments): boolean {
    const { startDateTime, date } = args.object as any;

    if (!startDateTime || !endDateTime || !date) return true;

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getUTCFullYear() === d2.getUTCFullYear() &&
      d1.getUTCMonth() === d2.getUTCMonth() &&
      d1.getUTCDate() === d2.getUTCDate();

    return (
      isSameDay(date, startDateTime) &&
      isSameDay(date, endDateTime) &&
      isSameDay(startDateTime, endDateTime)
    );
  }

  defaultMessage(): string {
    return 'The date, startDateTime, and endDateTime must all be on the same day.';
  }
}
