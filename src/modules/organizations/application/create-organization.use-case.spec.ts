import { describe, expect, it } from 'vitest';
import type { OrganizationRepository } from '../domain/organization.repository';
import { CreateOrganizationUseCase } from './create-organization.use-case';

describe('CreateOrganizationUseCase', () => {
  it('normalizes and creates an organization', async () => {
    const organizationRepository = {
      findBySlug: async () => null,
      create: async (data) => ({
        id: '11111111-1111-4111-8111-111111111111',
        name: data.name,
        slug: data.slug,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    } satisfies OrganizationRepository;
    const useCase = new CreateOrganizationUseCase(organizationRepository);

    const result = await useCase.execute({
      name: '  Helix Clinic  ',
      slug: 'HELIX-CLINIC',
    });

    expect(result.name).toBe('Helix Clinic');
    expect(result.slug).toBe('helix-clinic');
  });

  it('rejects duplicate organization slugs', async () => {
    const organizationRepository = {
      findBySlug: async () => ({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Helix Clinic',
        slug: 'helix-clinic',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
      create: async () => {
        throw new Error('Should not create duplicate organization');
      },
    } satisfies OrganizationRepository;
    const useCase = new CreateOrganizationUseCase(organizationRepository);

    await expect(
      useCase.execute({
        name: 'Helix Clinic',
        slug: 'helix-clinic',
      }),
    ).rejects.toThrow('Organization slug is already in use');
  });
});
