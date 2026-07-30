import { SetMetadata } from '@nestjs/common';
import { REQUIRED_PERMISSIONS_METADATA_KEY } from './http-auth.constants';

export function RequiredPermissions(...permissions: string[]) {
  return SetMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, permissions);
}
