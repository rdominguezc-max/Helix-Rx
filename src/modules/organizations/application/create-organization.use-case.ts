import { Inject, Injectable } from '@nestjs/common';
import type { Organization } from '../domain/organization.entity';
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from '../domain/organization.repository';
import {
  normalizeOrganizationName,
  normalizeSlug,
  validateOrganizationName,
  validateSlug,
} from './organization.validation';

export interface CreateOrganizationCommand {
  name: string;
  slug: string;
}

@Injectable()
export class CreateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(command: CreateOrganizationCommand): Promise<Organization> {
    const name = normalizeOrganizationName(command.name);
    const slug = normalizeSlug(command.slug);

    validateOrganizationName(name);
    validateSlug(slug);

    const existingOrganization =
      await this.organizationRepository.findBySlug(slug);

    if (existingOrganization) {
      throw new Error('Organization slug is already in use');
    }

    return this.organizationRepository.create({ name, slug });
  }
}
