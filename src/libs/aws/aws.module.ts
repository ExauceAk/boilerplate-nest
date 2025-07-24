import { Module } from '@nestjs/common';
import AwsS3File from './aws.service';

@Module({
    providers: [AwsS3File],
    exports: [AwsS3File],
})
export class S3Module {}
