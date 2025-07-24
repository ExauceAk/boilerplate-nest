import { Configuration, Value } from '@itgorillaz/configify';
import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

@Configuration()
export class RedisConfig {
    @IsNotEmpty({ message: 'Redis host should not be empty' })
    @IsString({ message: 'Redis host should be a string' })
    @Value('REDIS_HOST')
    redisHost: string;

    @IsNotEmpty({ message: 'Redis port should not be empty' })
    @Transform(({ value }) => parseInt(value, 10))
    @Value('REDIS_PORT')
    redisPort: number;
}
