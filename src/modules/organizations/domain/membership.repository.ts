import type {
  MembershipRelationship,
  OrganizationMembership,
} from './membership.entity';

export interface CreateMembershipData {
  organizationId: string;
  userId: string;
  roleId: string;
  relationship: MembershipRelationship;
}

export interface MembershipRepository {
  create(data: CreateMembershipData): Promise<OrganizationMembership>;
  findActiveByOrganizationAndUser(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMembership | null>;
}

export const MEMBERSHIP_REPOSITORY = Symbol('MEMBERSHIP_REPOSITORY');
