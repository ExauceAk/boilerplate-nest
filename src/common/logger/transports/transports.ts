import { consoleTransport } from './console-transport.config';
import { elasticsearchTransport } from './elasticsearch-transport.config';

const transports: any[] = [elasticsearchTransport];
if (process.env.NODE_ENV !== 'production') transports.push(consoleTransport);

export const loggerTransports = transports;
