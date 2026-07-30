export interface AuthenticatedRequestContext {
  userId: string;
  firebaseUid: string;
  email: string;
  emailVerified: boolean;
  organizationId: string | null;
}

export interface HttpRequestWithAuth {
  headers: Record<string, string | string[] | undefined>;
  params?: Record<string, string | undefined>;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
  authenticatedUser?: AuthenticatedRequestContext;
}
