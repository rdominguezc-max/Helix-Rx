import { describe, expect, it } from 'vitest';
import type { CoreRepository } from '../domain/core.repository';
import {
  buildCatalogItemFixture,
  buildFeatureFlagFixture,
  buildSupportedLanguageFixture,
  buildSupportedTimezoneFixture,
  organizationId,
} from './core.fixture';
import { IsFeatureEnabledUseCase } from './is-feature-enabled.use-case';
import { ListCatalogItemsUseCase } from './list-catalog-items.use-case';
import { ListSupportedLanguagesUseCase } from './list-supported-languages.use-case';
import { ListSupportedTimezonesUseCase } from './list-supported-timezones.use-case';

describe('Core reference use cases', () => {
  it('lists supported languages and timezones', async () => {
    const coreRepository = {
      getSystemParameter: async () => null,
      setSystemParameter: async () => {
        throw new Error('Not used');
      },
      getOrganizationSetting: async () => null,
      setOrganizationSetting: async () => {
        throw new Error('Not used');
      },
      listSupportedLanguages: async () => [buildSupportedLanguageFixture()],
      listSupportedTimezones: async () => [buildSupportedTimezoneFixture()],
      findFeatureFlag: async () => null,
      listCatalogItems: async () => [],
    } satisfies CoreRepository;

    await expect(
      new ListSupportedLanguagesUseCase(coreRepository).execute(),
    ).resolves.toHaveLength(1);
    await expect(
      new ListSupportedTimezonesUseCase(coreRepository).execute(),
    ).resolves.toHaveLength(1);
  });

  it('checks feature flag state with organization override support', async () => {
    const coreRepository = {
      getSystemParameter: async () => null,
      setSystemParameter: async () => {
        throw new Error('Not used');
      },
      getOrganizationSetting: async () => null,
      setOrganizationSetting: async () => {
        throw new Error('Not used');
      },
      listSupportedLanguages: async () => [],
      listSupportedTimezones: async () => [],
      findFeatureFlag: async (key, orgId) =>
        buildFeatureFlagFixture({
          key,
          organizationId: orgId ?? null,
          enabled: orgId === organizationId,
        }),
      listCatalogItems: async () => [],
    } satisfies CoreRepository;
    const useCase = new IsFeatureEnabledUseCase(coreRepository);

    await expect(
      useCase.execute({
        key: ' AUTH.FIREBASE.ENABLED ',
        organizationId,
      }),
    ).resolves.toBe(true);
  });

  it('lists catalog items using normalized locale', async () => {
    const coreRepository = {
      getSystemParameter: async () => null,
      setSystemParameter: async () => {
        throw new Error('Not used');
      },
      getOrganizationSetting: async () => null,
      setOrganizationSetting: async () => {
        throw new Error('Not used');
      },
      listSupportedLanguages: async () => [],
      listSupportedTimezones: async () => [],
      findFeatureFlag: async () => null,
      listCatalogItems: async (catalog, locale) => [
        buildCatalogItemFixture({ catalog, locale }),
      ],
    } satisfies CoreRepository;
    const useCase = new ListCatalogItemsUseCase(coreRepository);

    const result = await useCase.execute({
      catalog: ' AUDIT_RESULTS ',
      locale: 'es-mx',
    });

    expect(result[0].catalog).toBe('audit_results');
    expect(result[0].locale).toBe('es-MX');
  });
});
