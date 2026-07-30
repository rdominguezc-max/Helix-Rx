import { describe, expect, it } from 'vitest';
import { buildUserFixture, buildUserRepositoryFixture } from '../../users/application/user.fixture';
import { FindUserByIdUseCase } from '../../users/application/find-user-by-id.use-case';
import { GetMeProfileUseCase } from './get-me-profile.use-case';

describe('GetMeProfileUseCase', () => {
  it('returns authenticated user profile with organization context', async () => {
    const userRepository = buildUserRepositoryFixture({
      findById: async () =>
        buildUserFixture({
          id: '11111111-1111-4111-8111-111111111111',
          email: 'roberto@example.com',
          language: 'es',
          preferredLocale: 'es-MX',
          timezone: 'America/Hermosillo',
        }),
    });
    const useCase = new GetMeProfileUseCase(
      new FindUserByIdUseCase(userRepository),
    );

    const result = await useCase.execute({
      userId: '11111111-1111-4111-8111-111111111111',
      firebaseUid: 'firebase-user',
      email: 'roberto@example.com',
      emailVerified: true,
      organizationId: '22222222-2222-4222-8222-222222222222',
    });

    expect(result).toEqual({
      userId: '11111111-1111-4111-8111-111111111111',
      email: 'roberto@example.com',
      language: 'es',
      preferredLocale: 'es-MX',
      timezone: 'America/Hermosillo',
      organization: {
        organizationId: '22222222-2222-4222-8222-222222222222',
      },
    });
  });
});
