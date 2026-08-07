import { describe, expect, it } from 'vitest';
import type { PasswordRecoveryRepository } from '../domain/password-recovery.repository';
import type { PasswordRecoveryRequest } from '../domain/password-recovery-request';
import {
  PASSWORD_RECOVERY_CONFIRMATION,
  RequestPasswordRecoveryUseCase,
} from './password-recovery.use-cases';

class RepositoryFixture implements PasswordRecoveryRepository {
  created: { email: string; requesterKey: string } | null = null;

  async createPending(data: { email: string; requesterKey: string }) {
    this.created = data;
    return null;
  }
  async listPending(): Promise<PasswordRecoveryRequest[]> { return []; }
  async resolve(): Promise<PasswordRecoveryRequest | null> { return null; }
  async isAdministrator(): Promise<boolean> { return false; }
}

describe('Password recovery', () => {
  it('normalizes email and returns a neutral confirmation', async () => {
    const repository = new RepositoryFixture();
    const result = await new RequestPasswordRecoveryUseCase(repository).execute({
      email: '  User@Example.COM ',
      requesterAddress: '192.0.2.10',
    });

    expect(result.message).toBe(PASSWORD_RECOVERY_CONFIRMATION);
    expect(repository.created?.email).toBe('user@example.com');
    expect(repository.created?.requesterKey).not.toContain('192.0.2.10');
  });

  it('rejects malformed email without persisting', async () => {
    const repository = new RepositoryFixture();
    await expect(
      new RequestPasswordRecoveryUseCase(repository).execute({
        email: 'not-an-email',
        requesterAddress: null,
      }),
    ).rejects.toThrow('correo electrónico válido');
    expect(repository.created).toBeNull();
  });
});
