import { describe, expect, it } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { DatabaseService } from '../../database/database.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns a healthy service response', async () => {
    const configService = {
      getOrThrow: (key: string) => {
        if (key === 'appName') {
          return 'helix';
        }

        throw new Error(`Unexpected config key: ${key}`);
      },
    } as ConfigService;
    const databaseService = {
      ping: async () => undefined,
    } as DatabaseService;
    const service = new HealthService(configService, databaseService);

    const result = await service.check();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('helix');
    expect(result.timestamp).toEqual(expect.any(String));
    expect(result.uptimeSeconds).toEqual(expect.any(Number));
    expect(result.database.status).toBe('ok');
  });
});
