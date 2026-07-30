import type { CatalogItem } from './catalog-item.entity';
import type { CoreValue } from './core-value';
import type { FeatureFlag } from './feature-flag.entity';
import type { OrganizationSetting } from './organization-setting.entity';
import type { SupportedLanguage } from './supported-language.entity';
import type { SupportedTimezone } from './supported-timezone.entity';
import type { SystemParameter } from './system-parameter.entity';

export interface SetSystemParameterData {
  key: string;
  value: CoreValue;
  description?: string | null;
}

export interface SetOrganizationSettingData {
  organizationId: string;
  key: string;
  value: CoreValue;
  description?: string | null;
}

export interface CoreRepository {
  getSystemParameter(key: string): Promise<SystemParameter | null>;
  setSystemParameter(data: SetSystemParameterData): Promise<SystemParameter>;
  getOrganizationSetting(
    organizationId: string,
    key: string,
  ): Promise<OrganizationSetting | null>;
  setOrganizationSetting(
    data: SetOrganizationSettingData,
  ): Promise<OrganizationSetting>;
  listSupportedLanguages(): Promise<SupportedLanguage[]>;
  listSupportedTimezones(): Promise<SupportedTimezone[]>;
  findFeatureFlag(
    key: string,
    organizationId?: string | null,
  ): Promise<FeatureFlag | null>;
  listCatalogItems(catalog: string, locale: string): Promise<CatalogItem[]>;
}

export const CORE_REPOSITORY = Symbol('CORE_REPOSITORY');
