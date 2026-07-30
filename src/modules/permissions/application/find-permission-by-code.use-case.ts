import { Inject, Injectable } from '@nestjs/common';
import type { Permission } from '../domain/permission.entity';
import {
  PERMISSION_REPOSITORY,
  type PermissionRepository,
} from '../domain/permission.repository';
import {
  normalizePermissionCode,
  validatePermissionCode,
} from './permission.validation';

@Injectable()
export class FindPermissionByCodeUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async execute(code: string): Promise<Permission | null> {
    const normalizedCode = normalizePermissionCode(code);

    validatePermissionCode(normalizedCode);

    return this.permissionRepository.findByCode(normalizedCode);
  }
}
