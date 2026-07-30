import type { MembershipRelationship } from '../domain/membership.entity';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const allowedRelationships = new Set<MembershipRelationship>([
  'owner',
  'admin',
  'member',
  'medical_staff',
  'caregiver',
]);

export function validateUuid(value: string, label: string): void {
  if (!uuidPattern.test(value)) {
    throw new Error(`${label} must be a valid UUID`);
  }
}

export function validateMembershipRelationship(
  relationship: MembershipRelationship,
): void {
  if (!allowedRelationships.has(relationship)) {
    throw new Error('Membership relationship is not supported');
  }
}

export function mapRelationshipToDefaultRoleCode(
  relationship: MembershipRelationship,
): string {
  const roleByRelationship: Record<MembershipRelationship, string> = {
    owner: 'organization_owner',
    admin: 'organization_admin',
    member: 'patient',
    medical_staff: 'medical_assistant',
    caregiver: 'caregiver',
  };

  return roleByRelationship[relationship];
}
