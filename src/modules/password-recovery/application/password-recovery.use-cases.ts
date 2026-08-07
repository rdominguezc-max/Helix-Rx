import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  PASSWORD_RECOVERY_REPOSITORY,
  type PasswordRecoveryRepository,
} from '../domain/password-recovery.repository';
import type { PasswordRecoveryRequest } from '../domain/password-recovery-request';

export const PASSWORD_RECOVERY_CONFIRMATION =
  'Si el correo corresponde a una cuenta, el administrador dará seguimiento a la solicitud.';

function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Ingresa un correo electrónico válido');
  }
  return email;
}

@Injectable()
export class RequestPasswordRecoveryUseCase {
  constructor(
    @Inject(PASSWORD_RECOVERY_REPOSITORY)
    private readonly repository: PasswordRecoveryRepository,
  ) {}

  async execute(data: { email: string; requesterAddress: string | null }) {
    const email = normalizeEmail(data.email);
    const requesterKey = createHash('sha256')
      .update(data.requesterAddress ?? 'unknown')
      .digest('hex');
    await this.repository.createPending({ email, requesterKey });
    return { message: PASSWORD_RECOVERY_CONFIRMATION };
  }
}

@Injectable()
export class ListPasswordRecoveryRequestsUseCase {
  constructor(
    @Inject(PASSWORD_RECOVERY_REPOSITORY)
    private readonly repository: PasswordRecoveryRepository,
  ) {}

  execute(): Promise<PasswordRecoveryRequest[]> {
    return this.repository.listPending();
  }
}

@Injectable()
export class ResolvePasswordRecoveryRequestUseCase {
  constructor(
    @Inject(PASSWORD_RECOVERY_REPOSITORY)
    private readonly repository: PasswordRecoveryRepository,
  ) {}

  execute(id: string): Promise<PasswordRecoveryRequest | null> {
    return this.repository.resolve(id);
  }
}

@Injectable()
export class IsPasswordRecoveryAdministratorUseCase {
  constructor(
    @Inject(PASSWORD_RECOVERY_REPOSITORY)
    private readonly repository: PasswordRecoveryRepository,
  ) {}

  execute(userId: string, email: string): Promise<boolean> {
    return this.repository.isAdministrator(userId, email);
  }
}
