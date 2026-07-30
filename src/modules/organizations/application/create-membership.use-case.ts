import { Inject, Injectable } from '@nestjs/common';
import { FindRoleByCodeUseCase } from '../../roles/application/find-role-by-code.use-case';
import type { OrganizationMembership } from '../domain/membership.entity';
import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '../domain/membership.repository';
import {
  mapRelationshipToDefaultRoleCode,
  validateMembershipRelationship,
  validateUuid,
} from './membership.validation';

export interface CreateMembershipCommand {
  organizationId: string;
  userId: string;
  relationship: OrganizationMembership['relationship'];
  roleCode?: string;
}

@Injectable()
export class CreateMembershipUseCase {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
    private readonly findRoleByCodeUseCase: FindRoleByCodeUseCase,
  ) {}

  async execute(command: CreateMembershipCommand): Promise<OrganizationMembership> {
    validateUuid(command.organizationId, 'organizationId');
    validateUuid(command.userId, 'userId');
    validateMembershipRelationship(command.relationship);
    const roleCode =
      command.roleCode ?? mapRelationshipToDefaultRoleCode(command.relationship);
    const role = await this.findRoleByCodeUseCase.execute(roleCode);

    if (!role) {
      throw new Error('membership role not found');
    }

    const existingMembership =
      await this.membershipRepository.findActiveByOrganizationAndUser(
        command.organizationId,
        command.userId,
      );

    if (existingMembership) {
      throw new Error('User already has an active membership in organization');
    }

    return this.membershipRepository.create({
      organizationId: command.organizationId,
      userId: command.userId,
      roleId: role.id,
      relationship: command.relationship,
    });
  }
}
