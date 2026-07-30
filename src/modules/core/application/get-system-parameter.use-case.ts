import { Inject, Injectable } from '@nestjs/common';
import {
  CORE_REPOSITORY,
  type CoreRepository,
} from '../domain/core.repository';
import type { SystemParameter } from '../domain/system-parameter.entity';
import { normalizeKey, validateKey } from './core.validation';

@Injectable()
export class GetSystemParameterUseCase {
  constructor(
    @Inject(CORE_REPOSITORY)
    private readonly coreRepository: CoreRepository,
  ) {}

  async execute(key: string): Promise<SystemParameter | null> {
    const normalizedKey = normalizeKey(key);

    validateKey(normalizedKey, 'system parameter key');

    return this.coreRepository.getSystemParameter(normalizedKey);
  }
}
