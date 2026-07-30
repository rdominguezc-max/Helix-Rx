export interface FirebaseAuthenticatedUser {
  firebaseUid: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
}
