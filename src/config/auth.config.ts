import { Configuration, Value } from '@itgorillaz/configify';
import { IsNotEmpty, IsString } from 'class-validator';

@Configuration()
export class AuthConfig {
    @IsNotEmpty({ message: 'Secret key for generating token is required' })
    @IsString({ message: 'Secret key for generating token must be a string' })
    @Value('JWT_SECRET')
    jwtSecret: string;

    @IsNotEmpty({ message: 'Expiration time for generating token is required' })
    @IsString({
        message: 'Expiration time for generating token must be a string',
    })
    @Value('JWT_EXPIRATION_TIME')
    jwtExpirationTime: string;
}
