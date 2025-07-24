import { RedocOptions } from 'nestjs-redoc';

export const createRedocConfig = (): RedocOptions => {
    return {
        title: 'Documentation API',
        logo: {
            url: 'https://example.com/logo.png',
            backgroundColor: '#F0F0F0',
            altText: 'Logo',
        },
        sortPropsAlphabetically: true,
        hideDownloadButton: false,
        hideHostname: false,
    };
};
