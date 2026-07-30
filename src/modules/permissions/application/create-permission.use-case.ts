import { Inject, Injectable } from '@nestjs/common';
import type { Permission } from '../domain/permission.entity';
import {
  PERMISSION_REPOSITORY,
  type PermissionRepository,
} from '../domain/permission.repository';
import {
  normalizePermissionCode,
  normalizePermissionDescription,
  normalizePermissionPart,
  splitPermissionCode,
  validatePermissionCode,
  validatePermissionDescription,
  validatePermissionPart,
} from './permission.validation';

export interface CreatePermissionCommand {
  code: string;
  description: string;
  resource?: string;
  action?: string;
}

@Injectable()
export class CreatePermissionUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async execute(command: CreatePermissionCommand): Promise<Permission> {
    const code = normalizePermissionCode(command.code);
    const description = normalizePermissionDescription(command.description);
    const codeParts = splitPermissionCode(code);
    const resource = normalizePermissionPart(command.resource ?? codeParts.resource);
    const action = normalizePermissionPart(command.action ?? codeParts.action);

    validatePermissionCode(code);
    validatePermissionDescription(description);
    validatePermissionPart(resource, 'resource');
    validatePermissionPart(action, 'action');

    if (code !== `${resource}.${action}`) {
      throw new Error('permission code must match resource and action');
    }

    const existingPermission = await this.permissionRepository.findByCode(code);

    if (existingPermission) {
      throw new Error('permission code is already in use');
    }

    return this.permissionRepository.create({
      code,
      description,
      resource,
      action,
    });
  }
}
