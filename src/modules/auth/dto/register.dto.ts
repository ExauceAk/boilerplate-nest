import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    IsUUID,
    Matches,
    MinLength,
} from 'class-validator';

export class RegisterUserDto {
    @ApiProperty({
        description: 'Fullname',
        example: 'John',
    })
    @IsNotEmpty({ message: 'Fullname should be required' })
    @IsString({ message: 'Fullname should be a string' })
    @MinLength(2, {
        message: 'Fullname should be at least 2 characters',
    })
    fullname: string;

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

    @ApiProperty({
        description: 'Password of the user',
        example: 'Password1!',
    })
    @IsNotEmpty({ message: 'Password is required' })
    @IsString({ message: 'Password must be a string' })
    @MinLength(12, {
        message: 'Password must be at least 12 characters long',
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
    confirmPassword: string;

    @ApiProperty({
        description: 'The userAvatar image file for the event',
        type: 'string',
        format: 'binary',
        required: false,
    })
    @IsString({ message: 'UserAvatar image should be a string' })
    userAvatar: string;

    @ApiProperty({
        description: 'Department UUIDs',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty()
    @IsUUID(4, { message: 'Department id must be a valid UUID' })
    department: string;
}
