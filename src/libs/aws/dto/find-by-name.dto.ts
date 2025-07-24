import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CheckFileDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  objectName: string;
}