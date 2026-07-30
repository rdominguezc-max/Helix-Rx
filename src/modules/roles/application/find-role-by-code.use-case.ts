import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '../domain/role.entity';
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from '../domain/role.repository';
import { normalizeRoleCode, validateRoleCode } from './role.validation';

@Injectable()
export class FindRoleByCodeUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(code: string): Promise<Role | null> {
    const normalizedCode = normalizeRoleCode(code);

    validateRoleCode(normalizedCode);

    return this.roleRepository.findByCode(normalizedCode);
  }
}
