export interface PasswordRecoveryRequest {
  id: string;
  email: string;
  status: 'pending' | 'resolved';
  createdAt: Date;
  resolvedAt: Date | null;
}
