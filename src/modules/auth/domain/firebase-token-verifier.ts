import type { FirebaseAuthenticatedUser } from './firebase-authenticated-user';

export interface FirebaseTokenVerifier {
  verifyIdToken(idToken: string): Promise<FirebaseAuthenticatedUser>;
}

export const FIREBASE_TOKEN_VERIFIER = Symbol('FIREBASE_TOKEN_VERIFIER');
