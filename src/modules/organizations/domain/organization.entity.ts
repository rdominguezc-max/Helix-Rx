export type OrganizationStatus = 'active' | 'inactive' | 'suspended';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
