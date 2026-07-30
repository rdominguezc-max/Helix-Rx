import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GetMeProfileUseCase } from './application/get-me-profile.use-case';
import { MeController } from './http/me.controller';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [MeController],
  providers: [GetMeProfileUseCase],
})
export class AccountModule {}
