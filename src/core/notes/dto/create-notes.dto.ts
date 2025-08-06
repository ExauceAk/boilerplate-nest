import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNotesDto {
    @ApiProperty({
        description: 'The name of the notes',
        example: 'Notes name ',
    })
    @IsNotEmpty({ message: 'Name is required' })
    @IsString({ message: 'Name should be a string' })
    name: string;

    @ApiProperty({
        description: 'The type of the notes',
        example: 'Notes type',
    })
    @IsNotEmpty({ message: 'Type is required' })
    @IsString({ message: 'Type should be a string' })
    type: string;
}
