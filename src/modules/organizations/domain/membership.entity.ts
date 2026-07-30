export type MembershipRelationship =
  | 'owner'
  | 'admin'
  | 'member'
  | 'medical_staff'
  | 'caregiver';

export type MembershipStatus = 'active' | 'invited' | 'inactive' | 'suspended';

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  relationship: MembershipRelationship;
  status: MembershipStatus;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
