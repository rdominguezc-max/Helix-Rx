export interface AuthenticatedUserContext {
  userId: string;
  firebaseUid: string;
  email: string;
  emailVerified: boolean;
}
