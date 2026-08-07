import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { AuthenticatedRequestContext } from '../src/modules/auth/http/authenticated-request-context';
import { FirebaseBearerAuthGuard } from '../src/modules/auth/http/firebase-bearer-auth.guard';
import {
  IsPasswordRecoveryAdministratorUseCase,
  ListPasswordRecoveryRequestsUseCase,
  RequestPasswordRecoveryUseCase,
  ResolvePasswordRecoveryRequestUseCase,
} from '../src/modules/password-recovery/application/password-recovery.use-cases';
import { PasswordRecoveryController } from '../src/modules/password-recovery/http/password-recovery.controller';

const pending = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'person@example.com',
  status: 'pending' as const,
  createdAt: new Date('2026-08-07T12:00:00.000Z'),
  resolvedAt: null,
};

describe('Password recovery API', () => {
  it('accepts public requests with a neutral response', async () => {
    const app = await createApp(true);
    const response = await request(app.getHttpServer())
      .post('/api/v1/password-recovery-requests')
      .send({ email: 'person@example.com' })
      .expect(201);
    expect(response.body.message).toContain('administrador dará seguimiento');
    expect(response.body).not.toHaveProperty('exists');
    await app.close();
  });

  it('rejects invalid email', async () => {
    const app = await createApp(true, true);
    await request(app.getHttpServer())
      .post('/api/v1/password-recovery-requests')
      .send({ email: 'invalid' })
      .expect(400);
    await app.close();
  });

  it('restricts pending requests to administrators', async () => {
    const app = await createApp(false);
    await request(app.getHttpServer())
      .get('/api/v1/password-recovery-requests')
      .expect(403);
    await app.close();
  });

  it('allows an administrator to resolve a request', async () => {
    const app = await createApp(true);
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/password-recovery-requests/${pending.id}/resolve`)
      .expect(200);
    expect(response.body.status).toBe('resolved');
    await app.close();
  });
});

async function createApp(admin: boolean, rejectCreate = false): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [PasswordRecoveryController],
    providers: [
      {
        provide: RequestPasswordRecoveryUseCase,
        useValue: {
          execute: async () => {
            if (rejectCreate) throw new Error('Ingresa un correo electrónico válido');
            return { message: 'Si el correo corresponde a una cuenta, el administrador dará seguimiento a la solicitud.' };
          },
        },
      },
      { provide: ListPasswordRecoveryRequestsUseCase, useValue: { execute: async () => [pending] } },
      {
        provide: ResolvePasswordRecoveryRequestUseCase,
        useValue: { execute: async () => ({ ...pending, status: 'resolved', resolvedAt: new Date() }) },
      },
      { provide: IsPasswordRecoveryAdministratorUseCase, useValue: { execute: async () => admin } },
    ],
  })
    .overrideGuard(FirebaseBearerAuthGuard)
    .useValue({
      canActivate: (context: {
        switchToHttp: () => { getRequest: () => { authenticatedUser?: AuthenticatedRequestContext } };
      }) => {
        context.switchToHttp().getRequest().authenticatedUser = {
          userId: '22222222-2222-4222-8222-222222222222',
          firebaseUid: 'firebase-admin',
          email: 'rdominguezc@gmail.com',
          emailVerified: true,
          organizationId: null,
        };
        return true;
      },
    })
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  await app.init();
  return app;
}
