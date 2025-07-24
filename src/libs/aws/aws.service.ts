import {
    DeleteObjectCommand,
    DeleteObjectsCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageService } from 'src/interface/IStorageService';

@Injectable()
export default class AwsS3File implements IStorageService {
    private s3: S3Client;

    constructor(private readonly configService: ConfigService) {
        this.s3 = new S3Client({
            region: configService.get<string>('AWS_REGION'),
            credentials: {
                accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID'),
                secretAccessKey: configService.get<string>('AWS_SECRET_KEY'),
            },
        });
    }

    // Method of the IStorageService interface

    async uploadFile(
        file: Express.Multer.File,
        objectName: string,
    ): Promise<string> {
        const key = objectName;

        const params = {
            Bucket: this.configService.get<string>('BUCKET_NAME'),
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        const command = new PutObjectCommand(params);
        await this.s3.send(command);

        return `https://${this.configService.get<string>('BUCKET_NAME')}.s3.amazonaws.com/${key}`;
    }

    async deleteFile(objectName: string): Promise<void> {
        const params = {
            Bucket: this.configService.get<string>('BUCKET_NAME'),
            Key: objectName,
        };
        const command = new DeleteObjectCommand(params);
        await this.s3.send(command);
    }

    async deleteMultipleFiles(objectNames: string[]) {
        const keys = objectNames.map((objectName) => ({ Key: objectName }));
        const params = {
            Bucket: this.configService.get<string>('BUCKET_NAME'),
            Delete: {
                Objects: keys,
                Quiet: false,
            },
        };
        const command = new DeleteObjectsCommand(params);
        await this.s3.send(command);
        console.log(`Deleted files: ${objectNames.join(', ')}`);
    }

    async updateFile(file: Express.Multer.File, objectName: string) {
        await this.deleteFile(objectName);
        return await this.uploadFile(file, objectName);
    }

    // Not implemented for AWS
    async presignedGetObject(objectName: string): Promise<string> {
        return ` Presigned URL generation for ${objectName} is not implemented for AWS`;
    }

    async listAllObjects(): Promise<string[]> {
        const bucketName = this.configService.get<string>('BUCKET_NAME');
        const allKeys: string[] = [];

        let ContinuationToken: string | undefined = undefined;

        do {
            const command = new ListObjectsV2Command({
                Bucket: bucketName,
                ContinuationToken,
            });

            const response = await this.s3.send(command);

            if (response.Contents) {
                for (const item of response.Contents) {
                    if (item.Key) allKeys.push(item.Key);
                }
            }

            ContinuationToken = response.IsTruncated
                ? response.NextContinuationToken
                : undefined;
        } while (ContinuationToken);

        return allKeys;
    }
    // Additional methods

    private extractObjectName(url: string): string {
        return url.split('.com/')[1]; // Fonctionne pour S3 et Minio
    }

    async listFiles() {
        const params = {
            Bucket: this.configService.get<string>('BUCKET_NAME'),
        };
        const command = new ListObjectsV2Command(params);
        const data = await this.s3.send(command);
        return data.Contents || [];
    }

    async emptyBucket() {
        const files = await this.listFiles();
        const keys = files.map((file) => ({ Key: file.Key }));

        if (keys.length === 0) {
            console.log('Bucket is already empty');
            return;
        }

        const params = {
            Bucket: this.configService.get<string>('BUCKET_NAME'),
            Delete: {
                Objects: keys,
                Quiet: false,
            },
        };
        const command = new DeleteObjectsCommand(params);
        await this.s3.send(command);
        console.log('Bucket has been emptied');
    }
}
