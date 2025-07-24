import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Files } from './entities/file.entity';

// Importation des modules MinIO et S3
import { DatabaseModule } from 'src/libs/database/database.module';
import DetermineFileType from 'src/utils/file_type';
import { S3Module } from '../../libs/aws/aws.module';
import AwsS3File from '../../libs/aws/aws.service';
import { MinioModule } from '../../libs/minio/minio.module';
import { MinioService } from '../../libs/minio/minio.service';
import { FilesController } from './files.controller';
import { FilesRepository } from './files.repository';
import { FilesService } from './files.service';
import { FilesSeeder } from './files.seeder';

@Module({})
export class FileModule {
    static register(): DynamicModule {
        return {
            module: FileModule,
            imports: [
                DatabaseModule,
                DatabaseModule.forFeature([Files]),
                ConfigModule,
                S3Module,
                MinioModule,
                DetermineFileType,
            ],
            controllers: [FilesController],
            providers: [
                FilesService,
                FilesRepository,
                {
                    provide: 'STORAGE_SERVICE',
                    inject: [ConfigService, AwsS3File, MinioService],
                    useFactory: (
                        configService: ConfigService,
                        s3Service: AwsS3File,
                        minioService: MinioService,
                    ) => {
                        return configService.get<string>('STORAGE_PROVIDER') ===
                            's3'
                            ? s3Service
                            : minioService;
                    },
                },
                DetermineFileType,
                FilesSeeder,
            ],
            exports: ['STORAGE_SERVICE', FilesService, FilesRepository],
        };
    }
}
