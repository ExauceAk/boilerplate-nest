import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';
import { IsPasswordMatch } from '../../../common/decorators/isPasswordMatch.decorator';

export class EmailDto {
  @ApiProperty({
    description: 'Email of the user',
    example: 'johndoe@gmail.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email should be a valid email' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Id of the office' })
  @IsNotEmpty({ message: 'Office id is required' })
  @IsUUID('4', { message: 'Office id must be a valid UUID' })
  id: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'Password1!',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, {
    message: 'Password must be at least 8 characters long',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({
    description: 'Confirm password of the user',
    example: 'Password1!',
  })
  @IsNotEmpty({ message: 'Confirm password is required' })
  @IsString({ message: 'Confirm password must be a string' })
  @IsPasswordMatch('password', {
    message: 'Confirm password must match password',
  })
  confirmPassword: string;
}

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'Current password of the user',
    example: 'Password1!',
  })
  @IsNotEmpty({ message: 'Current password is required' })
  @IsString({ message: 'Current password must be a string' })
  currentPassword: string;

  @ApiProperty({
    description: 'New password of the user',
    example: 'Password1!',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, {
    message: 'Password must be at least 8 characters long',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirm password of the user',
    example: 'Password1!',
  })
  @IsNotEmpty({ message: 'Confirm password is required' })
  @IsString({ message: 'Confirm password must be a string' })
  @IsPasswordMatch('newPassword', {
    message: 'Confirm password must match password',
  })
  confirmPassword: string;
}

export class UpdateAuthorizedDto {
  @ApiProperty({
    description: 'Department UUIDs',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID(4, { message: 'Department id must be a valid UUID' })
  department: string;

  @ApiProperty({
    description: 'Is authorized',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Is authorized must be a boolean' })
  isAuthorized: boolean;
}

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Username',
    example: 'Doe',
  })
  @IsNotEmpty({ message: 'Username should be required' })
  @IsString({ message: 'Username should be a string' })
  @MinLength(2, {
    message: 'Username should be at least 2 characters',
  })
  username: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'johndoe@gmail.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'The email format is not valid' })
  email: string;
}
