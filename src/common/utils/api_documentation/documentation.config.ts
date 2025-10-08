import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

export const createSwaggerConfig = () => {
    const config = new DocumentBuilder()
        .setTitle('Docs API')
        .setDescription('Docs API v1')
        .setVersion('3.0')
        .addBearerAuth(
            { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            'JWT',
        )
        .setLicense('MIT', 'https://opensource.org/licenses/MIT')
        .setContact(
            'Docs API',
            'mailto:softvodooz@gmail.com',
            'softvodooz@gmail.com',
        )
        .build();

    const customOptions: SwaggerCustomOptions = {
        swaggerOptions: {
            url: '/docs-json',
        },
    };

    return { config, customOptions };
};
