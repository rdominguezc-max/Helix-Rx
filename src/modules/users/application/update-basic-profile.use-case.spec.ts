import { describe, expect, it } from 'vitest';
import { UpdateBasicProfileUseCase } from './update-basic-profile.use-case';
import { buildUserFixture, buildUserRepositoryFixture } from './user.fixture';

const userId = '11111111-1111-4111-8111-111111111111';

describe('UpdateBasicProfileUseCase', () => {
  it('updates a basic profile', async () => {
    const userRepository = buildUserRepositoryFixture({
      create: async () => {
        throw new Error('Not used');
      },
      updateBasicProfile: async (data) =>
        buildUserFixture({
        id: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
        language: data.language,
        timezone: data.timezone,
      }),
    });
    const useCase = new UpdateBasicProfileUseCase(userRepository);

    const result = await useCase.execute({
      userId,
      firstName: ' Roberto ',
      lastName: ' Dominguez ',
      phone: ' ',
      language: 'en',
      timezone: 'America/Hermosillo',
    });

    expect(result.firstName).toBe('Roberto');
    expect(result.lastName).toBe('Dominguez');
    expect(result.phone).toBeNull();
    expect(result.language).toBe('en');
  });

  it('rejects updates for missing users', async () => {
    const userRepository = buildUserRepositoryFixture({
      create: async () => {
        throw new Error('Not used');
      },
      updateBasicProfile: async () => null,
    });
    const useCase = new UpdateBasicProfileUseCase(userRepository);

    await expect(
      useCase.execute({
        userId,
        firstName: 'Roberto',
        lastName: 'Dominguez',
        language: 'es',
        timezone: 'America/Hermosillo',
      }),
    ).rejects.toThrow('user not found');
  });
});
