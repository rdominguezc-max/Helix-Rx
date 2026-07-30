import { Inject, Injectable } from '@nestjs/common';
import {
  CORE_REPOSITORY,
  type CoreRepository,
} from '../domain/core.repository';
import type { CoreValue } from '../domain/core-value';
import type { SystemParameter } from '../domain/system-parameter.entity';
import {
  normalizeDescription,
  normalizeKey,
  validateKey,
} from './core.validation';

export interface SetSystemParameterCommand {
  key: string;
  value: CoreValue;
  description?: string | null;
}

@Injectable()
export class SetSystemParameterUseCase {
  constructor(
    @Inject(CORE_REPOSITORY)
    private readonly coreRepository: CoreRepository,
  ) {}

  async execute(command: SetSystemParameterCommand): Promise<SystemParameter> {
    const key = normalizeKey(command.key);

    validateKey(key, 'system parameter key');

    return this.coreRepository.setSystemParameter({
      key,
      value: command.value,
      description: normalizeDescription(command.description),
    });
  }
}
