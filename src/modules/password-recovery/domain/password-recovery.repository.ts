import type { PasswordRecoveryRequest } from './password-recovery-request';

export const PASSWORD_RECOVERY_REPOSITORY = Symbol('PASSWORD_RECOVERY_REPOSITORY');

export interface PasswordRecoveryRepository {
  createPending(data: {
    email: string;
    requesterKey: string;
  }): Promise<PasswordRecoveryRequest | null>;
  listPending(): Promise<PasswordRecoveryRequest[]>;
  resolve(id: string): Promise<PasswordRecoveryRequest | null>;
  isAdministrator(userId: string, email: string): Promise<boolean>;
}
