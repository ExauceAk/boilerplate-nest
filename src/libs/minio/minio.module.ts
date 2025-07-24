import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import * as Minio from 'minio';
import { MinioService } from './minio.service';

@Global()
@Module({
    imports: [
        ConfigModule,
        MulterModule.register({
            dest: './uploads',
        }),
    ],
    providers: [
        MinioService,
        {
            provide: 'MINIO_CLIENT',
            useFactory: async (configService: ConfigService) => {
                return new Minio.Client({
                    endPoint: configService.get<string>('MINIO_ENDPOINT'),
                    port: parseInt(configService.get<string>('MINIO_PORT'), 10),
                    useSSL: true,
                    accessKey: configService.get<string>('MINIO_ROOT_USER'),
                    secretKey: configService.get<string>('MINIO_ROOT_PASSWORD'),
                });
            },
            inject: [ConfigService],
        },
    ],
    exports: ['MINIO_CLIENT', MinioService],
})
export class MinioModule {}
