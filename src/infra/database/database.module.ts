import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow('DB_HOST'),
        port: configService.getOrThrow('DB_PORT'),
        database: configService.getOrThrow('DB_NAME'),
        username: configService.getOrThrow('DB_USER'),
        password: configService.getOrThrow('DB_PASSWORD'),
        entities: [
          'app/entities/**/*.entities.ts',
          'app/entities/**/*.entities.ts',
        ],
        migrations: ['migration/**/*.ts'],
        synchronize: true /*configService.get('NODE_ENV') === 'dev'*/,
        autoLoadEntities: true,
        // ssl: true,
        caching: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {
  static forFeature(models: EntityClassOrSchema[]) {
    return TypeOrmModule.forFeature(models);
  }
}
