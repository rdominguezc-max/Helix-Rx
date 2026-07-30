import { describe, expect, it } from 'vitest';
import type { CoreRepository } from '../domain/core.repository';
import {
  buildOrganizationSettingFixture,
  buildSystemParameterFixture,
  organizationId,
} from './core.fixture';
import { GetOrganizationSettingUseCase } from './get-organization-setting.use-case';
import { GetSystemParameterUseCase } from './get-system-parameter.use-case';
import { SetOrganizationSettingUseCase } from './set-organization-setting.use-case';
import { SetSystemParameterUseCase } from './set-system-parameter.use-case';

describe('Core settings use cases', () => {
  it('gets a normalized system parameter', async () => {
    const coreRepository = {
      getSystemParameter: async (key) => buildSystemParameterFixture({ key }),
      setSystemParameter: async () => buildSystemParameterFixture(),
      getOrganizationSetting: async () => null,
      setOrganizationSetting: async () => buildOrganizationSettingFixture(),
      listSupportedLanguages: async () => [],
      listSupportedTimezones: async () => [],
      findFeatureFlag: async () => null,
      listCatalogItems: async () => [],
    } satisfies CoreRepository;
    const useCase = new GetSystemParameterUseCase(coreRepository);

    const result = await useCase.execute(' PLATFORM.DEFAULT_LOCALE ');

    expect(result?.key).toBe('platform.default_locale');
  });

  it('sets a normalized system parameter', async () => {
    const coreRepository = {
      getSystemParameter: async () => null,
      setSystemParameter: async (data) =>
        buildSystemParameterFixture({
          key: data.key,
          value: data.value,
          description: data.description ?? null,
        }),
      getOrganizationSetting: async () => null,
      setOrganizationSetting: async () => buildOrganizationSettingFixture(),
      listSupportedLanguages: async () => [],
      listSupportedTimezones: async () => [],
      findFeatureFlag: async () => null,
      listCatalogItems: async () => [],
    } satisfies CoreRepository;
    const useCase = new SetSystemParameterUseCase(coreRepository);

    const result = await useCase.execute({
      key: ' PLATFORM.DEFAULT_LANGUAGE ',
      value: 'es',
      description: ' Default language ',
    });

    expect(result.key).toBe('platform.default_language');
    expect(result.description).toBe('Default language');
  });

  it('sets and gets organization settings', async () => {
    const coreRepository = {
      getSystemParameter: async () => null,
      setSystemParameter: async () => buildSystemParameterFixture(),
      getOrganizationSetting: async (orgId, key) =>
        buildOrganizationSettingFixture({ organizationId: orgId, key }),
      setOrganizationSetting: async (data) =>
        buildOrganizationSettingFixture({
          organizationId: data.organizationId,
          key: data.key,
          value: data.value,
        }),
      listSupportedLanguages: async () => [],
      listSupportedTimezones: async () => [],
      findFeatureFlag: async () => null,
      listCatalogItems: async () => [],
    } satisfies CoreRepository;
    const setUseCase = new SetOrganizationSettingUseCase(coreRepository);
    const getUseCase = new GetOrganizationSettingUseCase(coreRepository);

    const saved = await setUseCase.execute({
      organizationId,
      key: ' NOTIFICATIONS.ENABLED ',
      value: true,
    });
    const loaded = await getUseCase.execute({
      organizationId,
      key: 'notifications.enabled',
    });

    expect(saved.key).toBe('notifications.enabled');
    expect(loaded?.organizationId).toBe(organizationId);
  });
});
