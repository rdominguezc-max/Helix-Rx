import { Inject, Injectable } from '@nestjs/common';
import {
  CORE_REPOSITORY,
  type CoreRepository,
} from '../domain/core.repository';
import type { OrganizationSetting } from '../domain/organization-setting.entity';
import { normalizeKey, validateKey, validateUuid } from './core.validation';

export interface GetOrganizationSettingCommand {
  organizationId: string;
  key: string;
}

@Injectable()
export class GetOrganizationSettingUseCase {
  constructor(
    @Inject(CORE_REPOSITORY)
    private readonly coreRepository: CoreRepository,
  ) {}

  async execute(
    command: GetOrganizationSettingCommand,
  ): Promise<OrganizationSetting | null> {
    const key = normalizeKey(command.key);

    validateUuid(command.organizationId, 'organizationId');
    validateKey(key, 'organization setting key');

    return this.coreRepository.getOrganizationSetting(
      command.organizationId,
      key,
    );
  }
}
