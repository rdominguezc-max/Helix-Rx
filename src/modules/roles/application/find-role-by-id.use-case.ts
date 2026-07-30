import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '../domain/role.entity';
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from '../domain/role.repository';
import { validateUuid } from './role.validation';

@Injectable()
export class FindRoleByIdUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(roleId: string): Promise<Role | null> {
    validateUuid(roleId, 'roleId');

    return this.roleRepository.findById(roleId);
  }
}
