import { Inject, Injectable } from '@nestjs/common';
import {
  CORE_REPOSITORY,
  type CoreRepository,
} from '../domain/core.repository';
import type { SupportedTimezone } from '../domain/supported-timezone.entity';

@Injectable()
export class ListSupportedTimezonesUseCase {
  constructor(
    @Inject(CORE_REPOSITORY)
    private readonly coreRepository: CoreRepository,
  ) {}

  async execute(): Promise<SupportedTimezone[]> {
    return this.coreRepository.listSupportedTimezones();
  }
}
