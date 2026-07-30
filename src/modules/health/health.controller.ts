import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import type { HealthCheckResponse } from './health.types';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check(): Promise<HealthCheckResponse> {
    return this.healthService.check();
  }
}
