import { Inject, Injectable } from '@nestjs/common';
import AwsS3File from '../../libs/aws/aws.service';
import { MinioService } from '../../libs/minio/minio.service';
import { FilesRepository } from './files.repository';
import { FilesService } from './files.service';
import * as path from 'path';

@Injectable()
export class FilesSeeder {
    constructor(
        private readonly repository: FilesRepository,
        private readonly fileService: FilesService,
        @Inject('STORAGE_SERVICE')
        private readonly storageService: AwsS3File | MinioService,
    ) {}

    /**
     * Seed all 'SysRole' records in the database.
     * @method seed
     * @async
     * @returns {Promise<void>} Returns a Promise that resolves when all 'SysRole' records have been created.
     */
    async seed(): Promise<void> {
        const logo = await this.repository.findOne({
            where: { objectName: 'logo' },
        });

        if (!logo) {
            const filePath = path.join(
                process.cwd(),
                'src',
                'utils',
                'files',
                'logo.png',
            );

            await this.fileService.simulateUploadAndCreate(filePath);
        }
    }
}
