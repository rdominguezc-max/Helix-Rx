import { Inject, Injectable } from '@nestjs/common';
import type { CatalogItem } from '../domain/catalog-item.entity';
import {
  CORE_REPOSITORY,
  type CoreRepository,
} from '../domain/core.repository';
import {
  normalizeKey,
  normalizeLocale,
  validateCode,
  validateLocale,
} from './core.validation';

export interface ListCatalogItemsCommand {
  catalog: string;
  locale?: string;
}

@Injectable()
export class ListCatalogItemsUseCase {
  constructor(
    @Inject(CORE_REPOSITORY)
    private readonly coreRepository: CoreRepository,
  ) {}

  async execute(command: ListCatalogItemsCommand): Promise<CatalogItem[]> {
    const catalog = normalizeKey(command.catalog);
    const locale = normalizeLocale(command.locale ?? 'es-MX');

    validateCode(catalog, 'catalog');
    validateLocale(locale);

    return this.coreRepository.listCatalogItems(catalog, locale);
  }
}
