import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, it } from 'vitest';
import { MeController } from '../src/modules/account/http/me.controller';
import { GetMeProfileUseCase } from '../src/modules/account/application/get-me-profile.use-case';
import { FirebaseBearerAuthGuard } from '../src/modules/auth/http/firebase-bearer-auth.guard';

describe('GET /api/v1/me', () => {
  it('returns 403 when the request is blocked by the guard', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MeController],
      providers: [
        {
          provide: GetMeProfileUseCase,
          useValue: {
            execute: async () => ({
              userId: '11111111-1111-4111-8111-111111111111',
              email: 'roberto@example.com',
              language: 'es',
              preferredLocale: 'es-MX',
              timezone: 'America/Hermosillo',
              organization: null,
            }),
          },
        },
      ],
    })
      .overrideGuard(FirebaseBearerAuthGuard)
      .useValue({
        canActivate: () => false,
      })
      .compile();

    const app: INestApplication = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer()).get('/api/v1/me').expect(403);

    await app.close();
  });
});
