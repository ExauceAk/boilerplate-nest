import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRole {
    @ApiProperty({ description: 'Role label', example: 'Admin' })
    @IsString({ message: 'Role label should be a string' })
    @IsNotEmpty({ message: 'Role label is required' })
    label: string;
}
