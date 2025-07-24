import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { IStorageService } from 'src/interface/IStorageService';
import { promisify } from 'util';

@Injectable()
export class MinioService implements IStorageService {
    constructor(
        @Inject('MINIO_CLIENT')
        private readonly minioClient: Minio.Client,
        private readonly configService: ConfigService,
    ) {}

    // Method of the IStorageService interface

    /**
     * Uploads a file to MinIO bucket
     * @param file
     * @param objectName
     * @returns {Promise<void>} - Promise that resolves when the file is uploaded successfully
     */

    async uploadFile(
        file: Express.Multer.File,
        objectName: string,
    ): Promise<string> {
        // Check if an object already exists

        const objectExists = await this.minioClient
            .statObject(
                this.configService.get<string>('BUCKET_NAME'),
                objectName,
            )
            .then(() => true)
            .catch((err) => {
                if (err.code === 'NotFound') return false;
                throw new HttpException(
                    `Error checking object existence: ${err.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            });

        if (objectExists) {
            // If an object exists, return the pre-signed URL
            return await this.minioClient.presignedGetObject(
                this.configService.get<string>('BUCKET_NAME'),
                objectName,
                604800, // 7 days in seconds
                {
                    'response-content-disposition': 'inline',
                    'response-content-type': file.mimetype,
                },
            );
        }
        // Upload a file to MinIO
        const putObject = promisify(this.minioClient.putObject).bind(
            this.minioClient,
        );
        console.log(`putObject ${putObject}`);

        await putObject(
            this.configService.get<string>('BUCKET_NAME'),
            objectName,
            file.buffer,
            file.size,
        ).catch((err: { message: any }) => {
            throw new HttpException(
                `Error uploading file: ${err.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        });

        // Generate resigned URL for the uploaded object (valid for 7 days)
        return await this.minioClient.presignedGetObject(
            this.configService.get<string>('BUCKET_NAME'),
            objectName,
            604800, // 7 days in seconds
            {
                'response-content-disposition': 'inline',
                'response-content-type': file.mimetype,
            },
        );
    }

    async deleteFile(objectName: string): Promise<void> {
        const removeObject = promisify(this.minioClient.removeObject).bind(
            this.minioClient,
        );
        await removeObject(
            this.configService.get<string>('BUCKET_NAME'),
            objectName,
        ).catch((err: { message: any }) => {
            throw new HttpException(
                `Error deleting file: ${err.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        });
    }
    async deleteMultipleFiles(objectName: string[]): Promise<void> {
        const removeObjects = promisify(this.minioClient.removeObjects).bind(
            this.minioClient,
        );
        await removeObjects(
            this.configService.get<string>('BUCKET_NAME'),
            objectName,
        ).catch((err: { message: any }) => {
            throw new HttpException(
                `Error deleting files: ${err.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        });
    }

    async updateFile(file: Express.Multer.File, objectName: string) {
        await this.deleteFile(objectName);
        return await this.uploadFile(file, objectName);
    }

    async presignedGetObject(objectName: string): Promise<string> {
        return this.minioClient.presignedGetObject(
            this.configService.get<string>('BUCKET_NAME'),
            objectName,
            604800, // 7 days in seconds
            {
                'response-content-disposition': 'inline',
                // 'response-content-type': file.mimetype,
            },
        );
    }

    async listAllObjects(): Promise<string[]> {
        const objectsStream = this.minioClient.listObjects(
            this.configService.get<string>('BUCKET_NAME'),
            '',
            true,
        );

        const objects: string[] = [];

        return new Promise<string[]>((resolve, reject) => {
            objectsStream.on('data', (obj) => {
                objects.push(obj.name); // Nom de l'objet
            });

            objectsStream.on('end', () => {
                resolve(objects);
            });

            objectsStream.on('error', (err) => {
                reject(err);
            });
        });
    }

    // Additional methods

    private extractObjectName(url: string): string {
        return url.split('.com/')[1]; // Fonctionne pour S3 et Minio
    }

    /**
     * Retrieves a file from a MinIO bucket by its ETag
     * @param bucketName - Name of the bucket to retrieve the file from
     * @param etag - ETag of the file to retrieve
     * @returns {Promise<any>} - Promise that resolves with the file metadata
     */
    async getFileByEtag(bucketName: string, etag: string): Promise<any> {
        let objectName = '';
        const stream = this.minioClient.listObjectsV2(bucketName, '');
        for await (const obj of stream) {
            if (obj.etag === etag) objectName = obj.name;
        }
        if (!objectName || objectName === '')
            throw new HttpException(
                `File with ETag ${etag} not found in bucket ${bucketName}`,
                HttpStatus.NOT_FOUND,
            );

        return await this.getFileContent(bucketName, objectName);
    }

    /**
     * Retrieves the content of a file from a MinIO bucket
     * @param bucketName - Name of the bucket to retrieve the file from
     * @param objectName - Name of the object (file) in the bucket
     * @returns {Promise<>} - Promise that resolves with the file content as a Buffer
     */
    async getFileContent(
        bucketName: string,
        objectName: string,
    ): Promise<{ content: Buffer; etag: string }> {
        try {
            const stat = await this.minioClient.statObject(
                bucketName,
                objectName,
            );
            const dataStream = await this.minioClient.getObject(
                bucketName,
                objectName,
            );
            const chunks: Buffer[] = [];
            for await (const chunk of dataStream) {
                chunks.push(chunk);
            }
            return { content: Buffer.concat(chunks), etag: stat.etag };
        } catch (err) {
            if (err.code === 'NoSuchKey') {
                throw new HttpException(
                    `Object ${objectName} not found in bucket ${bucketName}`,
                    HttpStatus.NOT_FOUND,
                );
            } else {
                throw new HttpException(
                    `Error retrieving object: ${err.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
        }
    }

    /**
     * Checks if a file exists in a MinIO bucket by its names
     * @param bucketName - Name of the bucket to check for the file
     * @param objectName - Name of the object (file) in the bucket
     */
    async isFileExistsByNames(bucketName: string, objectName: string) {
        try {
            return await this.minioClient.statObject(bucketName, objectName);
        } catch (err) {
            if (err.code === 'NotFound') {
                throw new HttpException(
                    `Object or file not found`,
                    HttpStatus.NOT_FOUND,
                );
            } else {
                throw new HttpException(
                    `Error checking object existence: ${err.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
        }
    }
}
