import { Inject, Injectable } from '@nestjs/common';
import {
  PERMISSION_REPOSITORY,
  type PermissionRepository,
} from '../../permissions/domain/permission.repository';
import type { RolePermission } from '../domain/role-permission.entity';
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from '../domain/role.repository';
import { validateUuid } from './role.validation';

export interface AssignPermissionToRoleCommand {
  roleId: string;
  permissionId: string;
}

@Injectable()
export class AssignPermissionToRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async execute(
    command: AssignPermissionToRoleCommand,
  ): Promise<RolePermission> {
    validateUuid(command.roleId, 'roleId');
    validateUuid(command.permissionId, 'permissionId');

    const role = await this.roleRepository.findById(command.roleId);

    if (!role) {
      throw new Error('role not found');
    }

    const permissions = await this.permissionRepository.listActive();
    const permissionExists = permissions.some(
      (permission) => permission.id === command.permissionId,
    );

    if (!permissionExists) {
      throw new Error('permission not found');
    }

    const existingRolePermission =
      await this.roleRepository.findRolePermission(
        command.roleId,
        command.permissionId,
      );

    if (existingRolePermission) {
      return existingRolePermission;
    }

    return this.roleRepository.assignPermission(
      command.roleId,
      command.permissionId,
    );
  }
}
