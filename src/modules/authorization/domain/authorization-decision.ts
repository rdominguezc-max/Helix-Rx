export type AuthorizationDecision = 'ALLOW' | 'DENY';

export interface AuthorizationResult {
  decision: AuthorizationDecision;
}
