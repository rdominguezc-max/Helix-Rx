import { Module } from '@nestjs/common';
import { GetOrganizationSettingUseCase } from './application/get-organization-setting.use-case';
import { GetSystemParameterUseCase } from './application/get-system-parameter.use-case';
import { IsFeatureEnabledUseCase } from './application/is-feature-enabled.use-case';
import { ListCatalogItemsUseCase } from './application/list-catalog-items.use-case';
import { ListSupportedLanguagesUseCase } from './application/list-supported-languages.use-case';
import { ListSupportedTimezonesUseCase } from './application/list-supported-timezones.use-case';
import { SetOrganizationSettingUseCase } from './application/set-organization-setting.use-case';
import { SetSystemParameterUseCase } from './application/set-system-parameter.use-case';
import { CORE_REPOSITORY } from './domain/core.repository';
import { PostgresCoreRepository } from './infrastructure/postgres-core.repository';

@Module({
  providers: [
    GetSystemParameterUseCase,
    SetSystemParameterUseCase,
    GetOrganizationSettingUseCase,
    SetOrganizationSettingUseCase,
    ListSupportedLanguagesUseCase,
    ListSupportedTimezonesUseCase,
    IsFeatureEnabledUseCase,
    ListCatalogItemsUseCase,
    {
      provide: CORE_REPOSITORY,
      useClass: PostgresCoreRepository,
    },
  ],
  exports: [
    GetSystemParameterUseCase,
    SetSystemParameterUseCase,
    GetOrganizationSettingUseCase,
    SetOrganizationSettingUseCase,
    ListSupportedLanguagesUseCase,
    ListSupportedTimezonesUseCase,
    IsFeatureEnabledUseCase,
    ListCatalogItemsUseCase,
  ],
})
export class CoreModule {}
