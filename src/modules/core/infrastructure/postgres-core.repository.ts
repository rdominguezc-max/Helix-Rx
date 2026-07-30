import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import type { CatalogItem } from '../domain/catalog-item.entity';
import type {
  CoreRepository,
  SetOrganizationSettingData,
  SetSystemParameterData,
} from '../domain/core.repository';
import type { CoreMetadata, CoreStatus, CoreValue } from '../domain/core-value';
import type { FeatureFlag } from '../domain/feature-flag.entity';
import type { OrganizationSetting } from '../domain/organization-setting.entity';
import type { SupportedLanguage } from '../domain/supported-language.entity';
import type { SupportedTimezone } from '../domain/supported-timezone.entity';
import type { SystemParameter } from '../domain/system-parameter.entity';

interface SystemParameterRow {
  id: string;
  key: string;
  value: CoreValue;
  description: string | null;
  status: CoreStatus;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface OrganizationSettingRow extends SystemParameterRow {
  organization_id: string;
}

interface SupportedLanguageRow {
  id: string;
  code: string;
  name: string;
  native_name: string;
  default_locale: string;
  status: CoreStatus;
}

interface SupportedTimezoneRow {
  id: string;
  name: string;
  country_code: string | null;
  status: CoreStatus;
}

interface FeatureFlagRow {
  id: string;
  key: string;
  enabled: boolean;
  organization_id: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface CatalogItemRow {
  id: string;
  catalog: string;
  code: string;
  label: string;
  locale: string;
  sort_order: number;
  metadata: CoreMetadata;
  status: CoreStatus;
}

function mapSystemParameter(row: SystemParameterRow): SystemParameter {
  return {
    id: row.id,
    key: row.key,
    value: row.value,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapOrganizationSetting(row: OrganizationSettingRow): OrganizationSetting {
  return {
    ...mapSystemParameter(row),
    organizationId: row.organization_id,
  };
}

function mapSupportedLanguage(row: SupportedLanguageRow): SupportedLanguage {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    nativeName: row.native_name,
    defaultLocale: row.default_locale,
    status: row.status,
  };
}

function mapSupportedTimezone(row: SupportedTimezoneRow): SupportedTimezone {
  return {
    id: row.id,
    name: row.name,
    countryCode: row.country_code,
    status: row.status,
  };
}

function mapFeatureFlag(row: FeatureFlagRow): FeatureFlag {
  return {
    id: row.id,
    key: row.key,
    enabled: row.enabled,
    organizationId: row.organization_id,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapCatalogItem(row: CatalogItemRow): CatalogItem {
  return {
    id: row.id,
    catalog: row.catalog,
    code: row.code,
    label: row.label,
    locale: row.locale,
    sortOrder: row.sort_order,
    metadata: row.metadata,
    status: row.status,
  };
}

@Injectable()
export class PostgresCoreRepository implements CoreRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getSystemParameter(key: string): Promise<SystemParameter | null> {
    const result = await this.databaseService.query<SystemParameterRow>(
      `
        SELECT id, key, value, description, status, created_at, updated_at, deleted_at
        FROM system_parameters
        WHERE key = $1
          AND status = 'active'
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [key],
    );

    const row = result.rows[0];

    return row ? mapSystemParameter(row) : null;
  }

  async setSystemParameter(
    data: SetSystemParameterData,
  ): Promise<SystemParameter> {
    const result = await this.databaseService.query<SystemParameterRow>(
      `
        INSERT INTO system_parameters (key, value, description)
        VALUES ($1, $2::jsonb, $3)
        ON CONFLICT (key) WHERE deleted_at IS NULL
        DO UPDATE SET
          value = EXCLUDED.value,
          description = EXCLUDED.description,
          updated_at = now()
        RETURNING id, key, value, description, status, created_at, updated_at, deleted_at
      `,
      [data.key, JSON.stringify(data.value), data.description ?? null],
    );

    return mapSystemParameter(result.rows[0]);
  }

  async getOrganizationSetting(
    organizationId: string,
    key: string,
  ): Promise<OrganizationSetting | null> {
    const result = await this.databaseService.query<OrganizationSettingRow>(
      `
        SELECT
          id,
          organization_id,
          key,
          value,
          description,
          status,
          created_at,
          updated_at,
          deleted_at
        FROM organization_settings
        WHERE organization_id = $1
          AND key = $2
          AND status = 'active'
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [organizationId, key],
    );

    const row = result.rows[0];

    return row ? mapOrganizationSetting(row) : null;
  }

  async setOrganizationSetting(
    data: SetOrganizationSettingData,
  ): Promise<OrganizationSetting> {
    const result = await this.databaseService.query<OrganizationSettingRow>(
      `
        INSERT INTO organization_settings (organization_id, key, value, description)
        VALUES ($1, $2, $3::jsonb, $4)
        ON CONFLICT (organization_id, key) WHERE deleted_at IS NULL
        DO UPDATE SET
          value = EXCLUDED.value,
          description = EXCLUDED.description,
          updated_at = now()
        RETURNING
          id,
          organization_id,
          key,
          value,
          description,
          status,
          created_at,
          updated_at,
          deleted_at
      `,
      [
        data.organizationId,
        data.key,
        JSON.stringify(data.value),
        data.description ?? null,
      ],
    );

    return mapOrganizationSetting(result.rows[0]);
  }

  async listSupportedLanguages(): Promise<SupportedLanguage[]> {
    const result = await this.databaseService.query<SupportedLanguageRow>(
      `
        SELECT id, code, name, native_name, default_locale, status
        FROM supported_languages
        WHERE status = 'active'
          AND deleted_at IS NULL
        ORDER BY code ASC
      `,
    );

    return result.rows.map(mapSupportedLanguage);
  }

  async listSupportedTimezones(): Promise<SupportedTimezone[]> {
    const result = await this.databaseService.query<SupportedTimezoneRow>(
      `
        SELECT id, name, country_code, status
        FROM supported_timezones
        WHERE status = 'active'
          AND deleted_at IS NULL
        ORDER BY name ASC
      `,
    );

    return result.rows.map(mapSupportedTimezone);
  }

  async findFeatureFlag(
    key: string,
    organizationId?: string | null,
  ): Promise<FeatureFlag | null> {
    const result = await this.databaseService.query<FeatureFlagRow>(
      `
        SELECT
          id,
          key,
          enabled,
          organization_id,
          description,
          created_at,
          updated_at,
          deleted_at
        FROM feature_flags
        WHERE key = $1
          AND deleted_at IS NULL
          AND (
            organization_id = $2
            OR organization_id IS NULL
          )
        ORDER BY organization_id IS NULL ASC
        LIMIT 1
      `,
      [key, organizationId ?? null],
    );

    const row = result.rows[0];

    return row ? mapFeatureFlag(row) : null;
  }

  async listCatalogItems(
    catalog: string,
    locale: string,
  ): Promise<CatalogItem[]> {
    const result = await this.databaseService.query<CatalogItemRow>(
      `
        SELECT id, catalog, code, label, locale, sort_order, metadata, status
        FROM catalog_items
        WHERE catalog = $1
          AND locale = $2
          AND status = 'active'
          AND deleted_at IS NULL
        ORDER BY sort_order ASC, label ASC
      `,
      [catalog, locale],
    );

    return result.rows.map(mapCatalogItem);
  }
}
