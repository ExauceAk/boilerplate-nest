import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { MinioService } from './minio.service';

@Controller('minio-files')
@ApiTags('Minio Files')
export class MinioController {
    constructor(private readonly minioService: MinioService) {}

    @Get(':objectName')
    async getFile(
        @Param('objectName') objectName: string,
        @Res() res: Response,
    ) {
        try {
            const { content, etag } = await this.minioService.getFileContent(
                'bucket',
                objectName,
            );
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('ETag', etag);
            res.send(content);
        } catch (err) {
            console.error(`Error retrieving file: ${err.message}`);
            res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: err.message,
            });
        }
    }
}
