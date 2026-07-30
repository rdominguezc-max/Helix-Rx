import type { User, UserLanguage, UserStatus } from './user.entity';

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  firebaseUid?: string | null;
  emailVerified?: boolean;
  phone?: string | null;
  language: UserLanguage;
  preferredLocale?: string;
  timezone: string;
  status: UserStatus;
}

export interface LinkFirebaseUserData {
  userId: string;
  firebaseUid: string;
  emailVerified: boolean;
}

export interface UpdateUserProfileData {
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  language: UserLanguage;
  timezone: string;
}

export interface UserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByFirebaseUid(firebaseUid: string): Promise<User | null>;
  linkFirebaseUser(data: LinkFirebaseUserData): Promise<User | null>;
  touchLoginActivity(userId: string): Promise<User | null>;
  updateBasicProfile(data: UpdateUserProfileData): Promise<User | null>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
