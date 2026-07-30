import { Inject, Injectable } from '@nestjs/common';
import type { Permission } from '../../permissions/domain/permission.entity';
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from '../domain/role.repository';
import { validateUuid } from './role.validation';

@Injectable()
export class ListPermissionsByRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(roleId: string): Promise<Permission[]> {
    validateUuid(roleId, 'roleId');

    const role = await this.roleRepository.findById(roleId);

    if (!role) {
      throw new Error('role not found');
    }

    return this.roleRepository.listPermissionsByRole(roleId);
  }
}
