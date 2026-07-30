export interface MeProfile {
  userId: string;
  email: string;
  language: string;
  preferredLocale: string;
  timezone: string;
  organization: {
    organizationId: string;
  } | null;
}
