import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Files } from './entities/file.entity';
import fromBuffer from 'image-size';
import { FilesRepository } from './files.repository';
import DetermineFileType from '../../utils/file_type';
import { IStorageService } from 'src/interface/IStorageService';
import { v4 as uuidv4 } from 'uuid';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { LessThan } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { createReadStream } from 'fs';
import { promisify } from 'util';

@Injectable()
export class FilesService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
        private readonly fileRepository: FilesRepository,
        @Inject('STORAGE_SERVICE')
        private readonly storageService: IStorageService, // <-- Correction ici
        private readonly fileType: DetermineFileType,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Find all files
     * @returns {Promise<Files[]>} - The list of files
     */
    async findAllFiles(): Promise<Files[]> {
        this.logger.log('info', 'Fetching all files');
        return await this.fileRepository.find({
            where: { deleted: false },
        });
    }

    /**
     * Find a file by id
     * @param {string} id - The id of the file
     * @returns {Promise<Files>} - The file
     * @throws {HttpException} - If the file is not found
     */
    async findFileByID(id: string): Promise<Files> {
        this.logger.log('info', `Fetching file with ID: ${id}`);
        const isFileExist = await this.fileRepository.findOne({
            where: { id, deleted: false },
        });
        if (!isFileExist) {
            this.logger.log('warn', `File with ID ${id} not found`);
            throw new HttpException('File not found', HttpStatus.NOT_FOUND);
        }
        return isFileExist;
    }

    /**
     * Find a file by label
     * @param {string} label - The label of the file
     * @returns {Promise<Files>} - The file
     * @throws {HttpException} - If the file is not found
     */
    async findFileByObjectName(objectName: string): Promise<Files> {
        this.logger.log('info', `Fetching file with label: ${objectName}`);
        const isFileExist = await this.fileRepository.findOne({
            where: { objectName },
        });
        if (!isFileExist) {
            this.logger.log('warn', `File with label ${objectName} not found`);
            throw new HttpException('File not found', HttpStatus.NOT_FOUND);
        }

        return isFileExist;
    }

    /**
     * Logic or check before saving a file
     */
    async logicBeforeSavingFile(file: Express.Multer.File) {
        const objectName = `${uuidv4()}-${file.originalname}`;
        const path = await this.storageService.uploadFile(file, objectName);
        const fileType = this.fileType.determineFileType(file.mimetype);

        const date = new Date();
        date.setDate(date.getDate() + 5);

        const fileEntity = new Files({
            objectName,
            path,
            size: file.size,
            type: fileType,
            isTemporary: true,
            expireDate:
                this.configService.get<string>('STORAGE_PROVIDER') !== 's3'
                    ? date.toISOString()
                    : null,
        });

        // If the file is a picture, extract dimensions
        if (fileType === 'image') {
            const dimensions = fromBuffer(file.buffer);
            fileEntity.width = dimensions.width;
            fileEntity.height = dimensions.height;
        }

        return fileEntity;
    }

    async logicBeforeSavingFileWithSpecificObjectName(
        file: Express.Multer.File,
        objectName: string,
    ) {
        const path = await this.storageService.uploadFile(file, objectName);
        const fileType = this.fileType.determineFileType(file.mimetype);

        const date = new Date();
        date.setDate(date.getDate() + 5);

        const fileEntity = new Files({
            objectName,
            path,
            size: file.size,
            type: fileType,
            isTemporary: true,
            expireDate:
                this.configService.get<string>('STORAGE_PROVIDER') !== 's3'
                    ? date.toISOString()
                    : null,
        });

        // If the file is a picture, extract dimensions
        if (fileType === 'image') {
            const dimensions = fromBuffer(file.buffer);
            fileEntity.width = dimensions.width;
            fileEntity.height = dimensions.height;
        }

        return fileEntity;
    }

    /**
     * Create a file from upload
     * @param  file - The file to upload
     * @returns {Promise<Files>} - The created file
     */
    async createFileFromUpload(file: Express.Multer.File): Promise<Files> {
        this.logger.log('info', `Creating file from upload with data`);
        const fileEntity = await this.logicBeforeSavingFile(file);

        return await this.fileRepository.create(fileEntity);
    }

    /**
     * Create multiple files from uploads
     * @param files - The files to upload
     * @returns {Promise<Files[]>} - The created files
     */
    async createFilesFromUploads(
        files: Express.Multer.File[],
    ): Promise<Files[]> {
        this.logger.log('info', `Creating multiple files from uploads`);

        const fileEntities: Files[] = [];
        for (const file of files) {
            const fileEntity = await this.logicBeforeSavingFile(file);
            fileEntities.push(fileEntity);
        }

        return await this.fileRepository.createMany(fileEntities);
    }

    async updateFile(file: Express.Multer.File, id: string): Promise<Files> {
        const isFileExist = await this.findFileByID(id);

        await this.storageService.updateFile(file, isFileExist.path);
        return await this.createFileFromUpload(file);
    }

    async deleteFile(id: string): Promise<object> {
        await this.findFileByID(id);

        await this.fileRepository.delete({ id });
        return { message: 'File deleted successfully' };
    }

    @Cron('0 */3 * * *')
    async updateFileLink(): Promise<void> {
        this.logger.log('info', `Updating file link`);

        const files = await this.fileRepository.find({
            where: { deleted: false },
        });

        if (!files || files.length === 0) {
            return;
        }

        const currentDate = new Date();

        for (const file of files) {
            if (file.expireDate && new Date(file.expireDate) < currentDate) {
                const newLink = await this.storageService.presignedGetObject(
                    file.objectName,
                );
                const date = new Date();
                date.setDate(date.getDate() + 5);
                this.fileRepository.update(
                    { id: file.id },
                    { path: newLink, expireDate: date.toISOString() },
                );
            }
        }
    }

    @Cron('0 23 * * *')
    async removeUnusedFiles(): Promise<void> {
        this.logger.log('info', `Removing unused files`);

        await this.cleanUnusedFiles();

        const filesFromStorage = await this.storageService.listAllObjects();

        const filesFromDatabase = await this.fileRepository.find({
            where: { deleted: false },
        });

        const validPaths = new Set(
            filesFromDatabase.map((file) => file.objectName),
        );

        // Liste les fichiers dans le storage qui ne sont plus en base
        const filesToDelete = filesFromStorage.filter(
            (filePath) => !validPaths.has(filePath),
        );

        this.logger.log(
            'info',
            `Found ${filesToDelete.length} unused files to delete.`,
        );

        for (const objectName of filesToDelete) {
            await this.storageService.deleteFile(objectName);
            this.logger.log('info', `Deleted unused file: ${objectName}`);
        }
    }

    async cleanUnusedFiles() {
        const limitDate = new Date(Date.now() - 60 * 60 * 1000); // one hour

        const oldTemps = await this.fileRepository.find({
            where: {
                isTemporary: true,
                createdAt: LessThan(limitDate),
            },
        });

        this.logger.log(
            'info',
            `Found ${oldTemps.length} old temporary files to delete.`,
        );

        for (const id of oldTemps.map((file) => file.id)) {
            await this.fileRepository.delete({ id });
            this.logger.log('info', `Deleted unused file: ${id}`);
        }
    }

    async simulateUploadAndCreate(filePath: string) {
        console.log('Simulating upload and create file...');

        const readFile = promisify(fs.readFile);

        const fileBuffer = await readFile(filePath);

        const multerFile: Express.Multer.File = {
            fieldname: 'file',
            originalname: path.basename(filePath),
            encoding: '7bit',
            mimetype: 'image/png',
            size: fileBuffer.length,
            buffer: fileBuffer,
            destination: '',
            filename: path.basename(filePath),
            path: filePath,
            stream: createReadStream(filePath),
        };

        const fileEntity =
            await this.logicBeforeSavingFileWithSpecificObjectName(
                multerFile,
                'logo',
            );

        return await this.fileRepository.create(fileEntity);
    }
}
