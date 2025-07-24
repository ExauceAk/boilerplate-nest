import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import Redis from 'ioredis';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { ConfigService } from '@nestjs/config';
import OtherUtils from '../../utils/tools';

@Injectable()
export class CacheService implements OnModuleDestroy {
    cacheMaxElement: number;
    segmentSize: number;
    defaultTTL: number;
    shortTTL: number;

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject('REDIS_CLIENT') readonly redisClient: Redis,
        private readonly errorHandlerService: ErrorHandlingService,
        private readonly configService: ConfigService,
        private readonly otherUtils: OtherUtils,
    ) {
        [
            this.cacheMaxElement,
            this.segmentSize,
            this.defaultTTL,
            this.shortTTL,
        ] = [
            this.configService.get<number>('CACHE_MAX_ELEMENTS'),
            this.configService.get<number>('CACHE_SEGMENT_SIZE'),
            this.configService.get<number>('REDIS_CACHE_TTL'),
            this.configService.get<number>('REDIS_CACHE_TTL_SHORT'),
        ];
    }

    /**
     * Generates a Redis key by combining a base string with filter parameters.
     * Converts filter entries into a string format and appends them to the base string.
     * Returns the constructed Redis key.
     */
    generateRedisKey(
        base: string,
        filters: Record<string, string | number>,
    ): string {
        const filterPart = Object.entries(filters)
            .map(([k, v]) => `${k}=${v}`)
            .join(':');
        return `${base}:${filterPart}`;
    }

    /**
     * Checks if a key exists in the Redis cache.
     * Returns true if the key exists, otherwise throws an error indicating the key was not found.
     */
    async isKeyExist(key: string): Promise<boolean> {
        try {
            this.logger.info(`Checking if key ${key} exists in the cache.`);
            return (await this.redisClient.exists(key)) === 1;
        } catch (error) {
            this.errorHandlerService.returnErrorOnConflict(
                `IS_KEY_EXIST : ${error.message}`,
                `IS_KEY_EXIST : ${error.message}`,
            );
        }
    }

    /**
     * Retrieves items from a Redis cache within a specified range.
     * Calculates the segments of cache pages to fetch based on the start and end indices.
     * Retrieves and concatenates the segments, then slices the result to match the requested range.
     * Returns an array of items within the specified range.
     */
    async getItemsFromCacheByRange(
        baseKey: string,
        startIndex: number,
        limit: number,
    ): Promise<any[]> {
        const [redisPageSize, endIndex] = [50, startIndex + limit];

        const [startSegment, endSegment] = [
            Math.floor(startIndex / redisPageSize) + 1,
            Math.floor((endIndex - 1) / redisPageSize) + 1,
        ];

        let items: any[] = [];

        for (let page = startSegment; page <= endSegment; page++) {
            const redisKey = `${baseKey}:page=${page}`;
            const cached = await this.redisClient.get(redisKey);
            if (!cached) {
                this.logger.warn(`Redis cache missing for ${redisKey}`);
                continue;
            }
            const segment = JSON.parse(cached);
            items = items.concat(segment);
        }

        const relativeStart = startIndex % redisPageSize;
        return items.slice(relativeStart, relativeStart + limit);
    }

    /**
     * Retrieves and caches fresh segmented data.
     * Fetches data using the provided function, slices it according to the specified range,
     * transforms the data, and paginates the results.
     * Initiates background caching of the segmented results and returns the paginated result.
     */
    async getAndCacheFreshSegmentedData<T>(
        baseTrancheKey: string,
        startIndex: number,
        trancheStart: number,
        limit: number,
        realTotal: number,
        trancheTTL: number,
        fetchFn: () => Promise<T[]>,
        transformFn: (items: T[]) => any[],
    ): Promise<object> {
        const data = await fetchFn();
        const relativeStart = startIndex - trancheStart;
        const items = data.slice(relativeStart, relativeStart + limit);

        const result = this.otherUtils.paginateResultsFromCache(
            transformFn(items),
            realTotal,
            Math.floor(startIndex / limit) + 1,
            limit,
        );

        setImmediate(() => {
            this.cacheSegmentedResults(baseTrancheKey, data, trancheTTL).catch(
                (err) =>
                    this.logger.warn(
                        `Background caching failed: ${err.message}`,
                    ),
            );
        });

        return result;
    }

    /**
     * Retrieves smart paginated results either from cache or by fetching fresh data.
     * Determines the cache segment based on the start index and checks if the segment is cached.
     * If not cached, fetches and caches fresh segmented data; otherwise, retrieves items from the cache.
     * Returns paginated results based on the transformed items.
     */
    async getSmartPaginatedResult(
        baseKey: string,
        realTotal: number,
        startIndex: number,
        limit: number,
        fetchFn: () => Promise<any[]>,
        transformFn: (items: any[]) => any[],
    ): Promise<object> {
        const trancheIndex = Math.floor(startIndex / this.cacheMaxElement);
        const [trancheStart, trancheTTL] = [
            trancheIndex * this.cacheMaxElement,
            trancheIndex === 0 ? this.defaultTTL : this.shortTTL,
        ];

        const baseTrancheKey = `${baseKey}:tranche=${trancheIndex}`;
        const cacheKeyForFirstPage = `${baseTrancheKey}:page=1`;

        const isCached = await this.isKeyExist(cacheKeyForFirstPage);

        if (!isCached) {
            return this.getAndCacheFreshSegmentedData(
                baseTrancheKey,
                startIndex,
                trancheStart,
                limit,
                realTotal,
                trancheTTL,
                fetchFn,
                transformFn,
            );
        }

        const items = await this.getItemsFromCacheByRange(
            baseTrancheKey,
            startIndex - trancheStart,
            limit,
        );

        return this.otherUtils.paginateResultsFromCache(
            transformFn(items),
            realTotal,
            Math.floor(startIndex / limit) + 1,
            limit,
        );
    }

    /**
     * Caches segmented results in Redis with a specified time-to-live (TTL).
     * Segments the data into pages and caches each page separately.
     * Log the caching process and any errors encountered during caching.
     */
    async cacheSegmentedResults(
        baseKey: string,
        data: any[],
        ttlInSeconds?: number,
    ): Promise<void> {
        const maxElements = 200;
        const segmentSize = 50;

        const totalToCache = Math.min(maxElements, data.length);
        const toCache = data.slice(0, totalToCache);
        const pageCount = Math.ceil(totalToCache / segmentSize);

        const safeTTL =
            typeof ttlInSeconds === 'number' && ttlInSeconds > 0
                ? ttlInSeconds
                : 300;

        this.logger.info(
            `📦 Caching ${totalToCache} items across ${pageCount} pages (TTL: ${safeTTL}s) for key: ${baseKey}`,
        );

        for (let page = 1; page <= pageCount; page++) {
            const start = (page - 1) * segmentSize;
            const end = start + segmentSize;
            const pageData = toCache.slice(start, end);

            const redisKey = `${baseKey}:page=${page}`;

            try {
                await this.redisClient.set(
                    redisKey,
                    JSON.stringify(pageData),
                    'EX',
                    safeTTL,
                );
                this.logger.info(
                    `✅ Cached ${totalToCache} items across ${pageCount} pages for key: ${baseKey}`,
                );
            } catch (err) {
                this.logger.warn(
                    `❌ Failed to cache ${redisKey}: ${err.message}`,
                );
            }
        }
    }

    async onModuleDestroy() {
        await this.redisClient.quit();
    }
}
