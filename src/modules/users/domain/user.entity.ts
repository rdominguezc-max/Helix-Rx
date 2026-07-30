export type UserStatus = 'active' | 'inactive' | 'suspended';
export type UserLanguage = 'es' | 'en';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  firebaseUid: string | null;
  emailVerified: boolean;
  phone: string | null;
  language: UserLanguage;
  preferredLocale: string;
  timezone: string;
  status: UserStatus;
  lastLoginAt: Date | null;
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
