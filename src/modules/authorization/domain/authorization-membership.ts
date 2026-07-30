export interface AuthorizationMembership {
  membershipId: string;
  userId: string;
  organizationId: string;
  roleId: string;
  roleCode: string;
  permissionCodes: string[];
}
