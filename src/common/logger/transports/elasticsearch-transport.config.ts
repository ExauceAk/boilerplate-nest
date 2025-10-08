import { ElasticsearchTransport } from 'winston-elasticsearch';

export const elasticsearchTransport = new ElasticsearchTransport({
  level: 'info',
  clientOpts: {
    node: 'http://localhost:9200', // TODO: Use env
  },
  indexPrefix: 'app-logs',
});
