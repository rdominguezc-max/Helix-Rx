import { Inject, Injectable } from '@nestjs/common';
import {
  CORE_REPOSITORY,
  type CoreRepository,
} from '../domain/core.repository';
import type { CoreValue } from '../domain/core-value';
import type { OrganizationSetting } from '../domain/organization-setting.entity';
import {
  normalizeDescription,
  normalizeKey,
  validateKey,
  validateUuid,
} from './core.validation';

export interface SetOrganizationSettingCommand {
  organizationId: string;
  key: string;
  value: CoreValue;
  description?: string | null;
}

@Injectable()
export class SetOrganizationSettingUseCase {
  constructor(
    @Inject(CORE_REPOSITORY)
    private readonly coreRepository: CoreRepository,
  ) {}

  async execute(
    command: SetOrganizationSettingCommand,
  ): Promise<OrganizationSetting> {
    const key = normalizeKey(command.key);

    validateUuid(command.organizationId, 'organizationId');
    validateKey(key, 'organization setting key');

    return this.coreRepository.setOrganizationSetting({
      organizationId: command.organizationId,
      key,
      value: command.value,
      description: normalizeDescription(command.description),
    });
  }
}
