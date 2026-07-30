const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const permissionCodePattern = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

export function validateUuid(value: string, label: string): boolean {
  return uuidPattern.test(value) && label.length > 0;
}

export function normalizePermissionCode(permissionCode: string): string {
  return permissionCode.trim().toLowerCase();
}

export function validatePermissionCode(permissionCode: string): boolean {
  return permissionCodePattern.test(normalizePermissionCode(permissionCode));
}

export function getPermissionResource(permissionCode: string): string {
  return normalizePermissionCode(permissionCode).split('.')[0] ?? '';
}
