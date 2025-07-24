import { Configuration, Value } from '@itgorillaz/configify';
import {
    IsNotEmpty,
    IsString,
    IsBoolean,
    IsIn,
    Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

const toBoolean = (value: string) => ['1', 'true'].includes(value);

@Configuration()
export class DatabaseConfig {
    @IsNotEmpty({ message: 'Node environment should not be empty' })
    @IsString({ message: 'Node environment should be a string' })
    @Value('NODE_ENV')
    nodeEnv: string;

    @IsNotEmpty({ message: 'DB host should not be empty' })
    @IsString({ message: 'DB host should be a string' })
    @Value('DB_HOST')
    dbHost: string;

    @IsNotEmpty({ message: 'DB port should not be empty' })
    @Transform(({ value }) => parseInt(value, 10))
    @Matches(/^\d{4}$/, { message: 'DB port should be a 4-digit number' })
    @Value('DB_PORT')
    dbPort: number;

    @IsNotEmpty({ message: 'DB name should not be empty' })
    @IsString({ message: 'DB name should be a string' })
    @Value('DB_NAME')
    dbName: string;

    @IsNotEmpty({ message: 'DB user should not be empty' })
    @IsString({ message: 'DB user should be a string' })
    @Value('DB_USER')
    dbUser: string;

    @IsNotEmpty({ message: 'DB password should not be empty' })
    @IsString({ message: 'DB password should be a string' })
    @Value('DB_PASSWORD')
    dbPassword: string;

    @IsBoolean({ message: 'DB debug should be a boolean' })
    @Value('DEBUG', { parse: toBoolean })
    dbDebug: boolean;

    @IsNotEmpty({ message: 'DB type should not be empty' })
    @IsString({ message: 'DB type should be a string' })
    @IsIn(['mysql', 'postgres', 'sqlite'], {
        message: 'DB type should be one of mysql, postgres, sqlite',
    })
    @Value('DB_TYPE')
    dbType: string;

    @IsBoolean({ message: 'DB sync should be a boolean' })
    @Value('DB_SYNC', { parse: toBoolean })
    dbSync: boolean;

    @IsNotEmpty({ message: 'DB SSL should not be empty' })
    @Transform(({ value }) => parseInt(value, 10))
    @Value('DB_SSL')
    dbSsl: number;
}
