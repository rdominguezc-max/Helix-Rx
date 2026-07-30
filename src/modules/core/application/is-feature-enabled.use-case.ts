import { Inject, Injectable } from '@nestjs/common';
import {
  CORE_REPOSITORY,
  type CoreRepository,
} from '../domain/core.repository';
import { normalizeKey, validateKey, validateUuid } from './core.validation';

export interface IsFeatureEnabledCommand {
  key: string;
  organizationId?: string | null;
}

@Injectable()
export class IsFeatureEnabledUseCase {
  constructor(
    @Inject(CORE_REPOSITORY)
    private readonly coreRepository: CoreRepository,
  ) {}

  async execute(command: IsFeatureEnabledCommand): Promise<boolean> {
    const key = normalizeKey(command.key);

    validateKey(key, 'feature flag key');

    if (command.organizationId) {
      validateUuid(command.organizationId, 'organizationId');
    }

    const featureFlag = await this.coreRepository.findFeatureFlag(
      key,
      command.organizationId,
    );

    return featureFlag?.enabled ?? false;
  }
}
