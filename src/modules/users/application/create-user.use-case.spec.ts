import { describe, expect, it } from 'vitest';
import { CreateUserUseCase } from './create-user.use-case';
import { buildUserFixture, buildUserRepositoryFixture } from './user.fixture';

describe('CreateUserUseCase', () => {
  it('normalizes and creates a user', async () => {
    const userRepository = buildUserRepositoryFixture({
      findByEmail: async () => null,
      create: async (data) =>
        buildUserFixture({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone ?? null,
        language: data.language,
        timezone: data.timezone,
        status: data.status,
      }),
    });
    const useCase = new CreateUserUseCase(userRepository);

    const result = await useCase.execute({
      firstName: '  Roberto  ',
      lastName: '  Dominguez  ',
      email: ' ROBERTO@example.COM ',
    });

    expect(result.firstName).toBe('Roberto');
    expect(result.lastName).toBe('Dominguez');
    expect(result.email).toBe('roberto@example.com');
    expect(result.language).toBe('es');
    expect(result.timezone).toBe('America/Hermosillo');
    expect(result.status).toBe('active');
  });

  it('rejects duplicate emails', async () => {
    const userRepository = buildUserRepositoryFixture({
      findByEmail: async () =>
        buildUserFixture({
        firstName: 'Roberto',
        lastName: 'Dominguez',
        email: 'roberto@example.com',
      }),
      findById: async () => null,
      updateBasicProfile: async () => null,
      create: async () => {
        throw new Error('Should not create duplicate user');
      },
    });
    const useCase = new CreateUserUseCase(userRepository);

    await expect(
      useCase.execute({
        firstName: 'Roberto',
        lastName: 'Dominguez',
        email: 'roberto@example.com',
      }),
    ).rejects.toThrow('email is already in use');
  });
});
