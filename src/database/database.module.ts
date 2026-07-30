import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DATABASE_POOL } from './database.constants';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Pool =>
        new Pool({
          host: configService.getOrThrow<string>('database.host'),
          port: configService.getOrThrow<number>('database.port'),
          user: configService.getOrThrow<string>('database.user'),
          password: configService.getOrThrow<string>('database.password'),
          database: configService.getOrThrow<string>('database.name'),
          ssl: configService.getOrThrow<boolean>('database.ssl')
            ? { rejectUnauthorized: true }
            : false,
        }),
    },
    DatabaseService,
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
