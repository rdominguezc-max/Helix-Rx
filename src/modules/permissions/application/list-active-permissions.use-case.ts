import { Inject, Injectable } from '@nestjs/common';
import type { Permission } from '../domain/permission.entity';
import {
  PERMISSION_REPOSITORY,
  type PermissionRepository,
} from '../domain/permission.repository';

@Injectable()
export class ListActivePermissionsUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async execute(): Promise<Permission[]> {
    return this.permissionRepository.listActive();
  }
}
