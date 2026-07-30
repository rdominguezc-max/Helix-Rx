export interface PatientRegisteredEvent {
  name: 'PatientRegistered';
  patientId: string;
  organizationId: string;
  patientOrganizationMembershipId: string;
  registeredBy: string | null;
  registeredAt: Date;
  hasLinkedUser: boolean;
}
