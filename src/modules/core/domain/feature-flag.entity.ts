export interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  organizationId: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
