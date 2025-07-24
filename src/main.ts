import { NestFactory, Reflector } from '@nestjs/core';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { RedocModule } from 'nestjs-redoc';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { CircularInterceptor } from './common/interceptors/circular.interceptor';
import { ResponseInterceptor } from './common/response/response.interceptor';
import { CustomValidationPipe } from './common/response/customValidationPipe';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createSwaggerConfig } from './helpers/api_documentation/documentation.config';
import { createRedocConfig } from './helpers/api_documentation/redoc.config';
import { allSeeder } from './common/seeder/seeders';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    /*const logger = */ app.get<Logger>(WINSTON_MODULE_PROVIDER);

    app.enableCors();
    app.setGlobalPrefix('api/v1');
    app.useWebSocketAdapter(new IoAdapter(app));
    // app.useGlobalFilters(new ErrorInterceptor(logger));
    app.useGlobalInterceptors(new CircularInterceptor());
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalPipes(new CustomValidationPipe());
    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

    for (const Seeder of allSeeder) {
        const seeder = app.get(Seeder);
        await seeder.seed();
    }

    const { config, customOptions } = createSwaggerConfig();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('', app, document, customOptions);

    const redocOptions = createRedocConfig();
    await RedocModule.setup('/docs', app, document, redocOptions);

    const configService = app.get(ConfigService);

    const port = configService.getOrThrow('PORT');

    await app.listen(port);
    console.log(`App is running on PORT: ${port}`);
}
bootstrap().then(() => console.log(`App is running`));
