import type { CatalogItem } from '../domain/catalog-item.entity';
import type { FeatureFlag } from '../domain/feature-flag.entity';
import type { OrganizationSetting } from '../domain/organization-setting.entity';
import type { SupportedLanguage } from '../domain/supported-language.entity';
import type { SupportedTimezone } from '../domain/supported-timezone.entity';
import type { SystemParameter } from '../domain/system-parameter.entity';

export const organizationId = '11111111-1111-4111-8111-111111111111';

export function buildSystemParameterFixture(
  overrides: Partial<SystemParameter> = {},
): SystemParameter {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    key: 'platform.default_locale',
    value: 'es-MX',
    description: 'Default locale',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export function buildOrganizationSettingFixture(
  overrides: Partial<OrganizationSetting> = {},
): OrganizationSetting {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    organizationId,
    key: 'notifications.enabled',
    value: true,
    description: 'Enable notifications',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export function buildFeatureFlagFixture(
  overrides: Partial<FeatureFlag> = {},
): FeatureFlag {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    key: 'auth.firebase.enabled',
    enabled: false,
    organizationId: null,
    description: 'Firebase Auth prepared flag',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export function buildSupportedLanguageFixture(
  overrides: Partial<SupportedLanguage> = {},
): SupportedLanguage {
  return {
    id: '55555555-5555-4555-8555-555555555555',
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    defaultLocale: 'es-MX',
    status: 'active',
    ...overrides,
  };
}

export function buildSupportedTimezoneFixture(
  overrides: Partial<SupportedTimezone> = {},
): SupportedTimezone {
  return {
    id: '66666666-6666-4666-8666-666666666666',
    name: 'America/Hermosillo',
    countryCode: 'MX',
    status: 'active',
    ...overrides,
  };
}

export function buildCatalogItemFixture(
  overrides: Partial<CatalogItem> = {},
): CatalogItem {
  return {
    id: '77777777-7777-4777-8777-777777777777',
    catalog: 'audit_results',
    code: 'success',
    label: 'Exitoso',
    locale: 'es-MX',
    sortOrder: 10,
    metadata: {},
    status: 'active',
    ...overrides,
  };
}
