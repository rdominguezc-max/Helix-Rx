import { describe, expect, it } from 'vitest';
import { FindUserByEmailUseCase } from './find-user-by-email.use-case';
import { FindUserByIdUseCase } from './find-user-by-id.use-case';
import { buildUserFixture, buildUserRepositoryFixture } from './user.fixture';

const user = buildUserFixture();

describe('FindUser use cases', () => {
  it('finds a user by id', async () => {
    const userRepository = buildUserRepositoryFixture({
      findById: async () => user,
    });
    const useCase = new FindUserByIdUseCase(userRepository);

    await expect(useCase.execute(user.id)).resolves.toEqual(user);
  });

  it('normalizes email before finding a user', async () => {
    const userRepository = buildUserRepositoryFixture({
      findByEmail: async (email) =>
        email === 'roberto@example.com' ? user : null,
    });
    const useCase = new FindUserByEmailUseCase(userRepository);

    await expect(useCase.execute(' ROBERTO@example.COM ')).resolves.toEqual(user);
  });
});
