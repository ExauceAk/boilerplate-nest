import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateStatusDto {
    @ApiProperty({
        description: 'The name of the status',
        example: 'Status name ',
    })
    @IsNotEmpty({ message: 'Name is required' })
    @IsString({ message: 'Name should be a string' })
    name: string;

    @ApiProperty({
        description: 'The type of the status',
        example: 'Status type',
    })
    @IsNotEmpty({ message: 'Type is required' })
    @IsString({ message: 'Type should be a string' })
    type: string;
}
