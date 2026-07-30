import { Inject, Injectable } from '@nestjs/common';
import {
  CORE_REPOSITORY,
  type CoreRepository,
} from '../domain/core.repository';
import type { SupportedLanguage } from '../domain/supported-language.entity';

@Injectable()
export class ListSupportedLanguagesUseCase {
  constructor(
    @Inject(CORE_REPOSITORY)
    private readonly coreRepository: CoreRepository,
  ) {}

  async execute(): Promise<SupportedLanguage[]> {
    return this.coreRepository.listSupportedLanguages();
  }
}
