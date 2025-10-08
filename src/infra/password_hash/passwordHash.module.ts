import { Module } from '@nestjs/common';
import { PasswordHashService } from './passwordHash.service';

@Module({
  providers: [PasswordHashService],
  exports: [PasswordHashService],
})
export class PasswordHashModule {}
