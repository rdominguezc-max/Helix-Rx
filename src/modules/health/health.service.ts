import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import type { HealthCheckResponse } from './health.types';

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  async check(): Promise<HealthCheckResponse> {
    await this.databaseService.ping();

    return {
      status: 'ok',
      service: this.configService.getOrThrow<string>('appName'),
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      database: {
        status: 'ok',
      },
    };
  }
}
