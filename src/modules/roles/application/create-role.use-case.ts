import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '../domain/role.entity';
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from '../domain/role.repository';
import {
  normalizeRoleCode,
  normalizeRoleDescription,
  normalizeRoleName,
  validateRoleCode,
  validateRoleDescription,
  validateRoleName,
  validateRoleStatus,
} from './role.validation';

export interface CreateRoleCommand {
  code: string;
  name: string;
  description: string;
  status?: Role['status'];
}

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(command: CreateRoleCommand): Promise<Role> {
    const code = normalizeRoleCode(command.code);
    const name = normalizeRoleName(command.name);
    const description = normalizeRoleDescription(command.description);
    const status = command.status ?? 'active';

    validateRoleCode(code);
    validateRoleName(name);
    validateRoleDescription(description);
    validateRoleStatus(status);

    const existingRole = await this.roleRepository.findByCode(code);

    if (existingRole) {
      throw new Error('role code is already in use');
    }

    return this.roleRepository.create({
      code,
      name,
      description,
      status,
    });
  }
}
