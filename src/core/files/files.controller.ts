import {
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Patch,
    Post,
    UploadedFile,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
    ApiBody,
    ApiConsumes,
    ApiNotFoundResponse,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { Files } from './entities/file.entity';
import { FilesService } from './files.service';

@ApiTags('files')
@Controller('files')
export class FilesController {
    constructor(private readonly service: FilesService) {}

    @Get()
    async findAll(): Promise<Files[]> {
        return await this.service.findAllFiles();
    }

    @Get('findBy/:id')
    @ApiParam({
        name: 'id',
        description: 'File ID',
        type: 'string',
    })
    @ApiNotFoundResponse({ description: 'File not found' })
    async findOne(@Param('id') id: string): Promise<Files> {
        return await this.service.findFileByID(id);
    }

    @Get('find/byObjectName/:objectName')
    @ApiParam({
        name: 'objectName',
        description: 'File objectName',
        type: 'string',
    })
    async findByLabel(@Param('objectName') objectName: string): Promise<Files> {
        return await this.service.findFileByObjectName(objectName);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Create File',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File',
                },
            },
        },
    })
    async createFile(
        @UploadedFile() file: Express.Multer.File,
    ): Promise<Files> {
        if (!file) throw new NotFoundException('File is undefined');
        return await this.service.createFileFromUpload(file);
    }

    @Post('upload-multiple')
    @UseInterceptors(FilesInterceptor('files'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Create Multiple Files',
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                    description: 'Array of files',
                },
            },
        },
    })
    async createMultipleFiles(
        @UploadedFiles() files: Express.Multer.File[],
    ): Promise<Files[]> {
        if (!files || files.length === 0) {
            throw new NotFoundException('No files were uploaded');
        }

        return await this.service.createFilesFromUploads(files);
    }

    @Patch(':id')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Update File',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File',
                },
            },
        },
    })
    @ApiParam({
        name: 'id',
        description: 'File ID',
        type: 'string',
    })
    async updateFile(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return await this.service.updateFile(file, id);
    }

    @Delete(':id')
    @ApiParam({
        name: 'id',
        description: 'File ID',
        type: 'string',
    })
    async deleteFile(@Param('id') id: string) {
        return await this.service.deleteFile(id);
    }
}
