import { describe, expect, it } from 'vitest';
import { MeController } from './me.controller';
import type { GetMeProfileUseCase } from '../application/get-me-profile.use-case';

describe('MeController', () => {
  it('returns the current authenticated profile', async () => {
    const getMeProfileUseCase = {
      execute: async () => ({
        userId: '11111111-1111-4111-8111-111111111111',
        email: 'roberto@example.com',
        language: 'es',
        preferredLocale: 'es-MX',
        timezone: 'America/Hermosillo',
        organization: null,
      }),
    } as unknown as GetMeProfileUseCase;
    const controller = new MeController(getMeProfileUseCase);

    await expect(
      controller.getMe({
        userId: '11111111-1111-4111-8111-111111111111',
        firebaseUid: 'firebase-user',
        email: 'roberto@example.com',
        emailVerified: true,
        organizationId: null,
      }),
    ).resolves.toMatchObject({
      userId: '11111111-1111-4111-8111-111111111111',
      email: 'roberto@example.com',
    });
  });
});
