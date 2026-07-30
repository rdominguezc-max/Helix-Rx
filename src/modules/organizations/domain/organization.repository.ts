import type { Organization } from './organization.entity';

export interface CreateOrganizationData {
  name: string;
  slug: string;
}

export interface OrganizationRepository {
  create(data: CreateOrganizationData): Promise<Organization>;
  findBySlug(slug: string): Promise<Organization | null>;
}

export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');
