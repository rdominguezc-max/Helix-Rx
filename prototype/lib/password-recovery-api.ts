import type { User } from "firebase/auth";

const apiUrl = process.env.NEXT_PUBLIC_HELIX_API_URL;
const organizationId = process.env.NEXT_PUBLIC_HELIX_ORGANIZATION_ID;

export interface PasswordRecoveryRequest {
  id: string;
  email: string;
  status: "pending" | "resolved";
  createdAt: string;
  resolvedAt: string | null;
}

async function detail(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  return body?.message ?? `La API respondió ${response.status}`;
}

export async function requestPasswordRecovery(email: string): Promise<string> {
  if (!apiUrl) throw new Error("API de Helix no configurada");
  const response = await fetch(`${apiUrl}/password-recovery-requests`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw new Error(await detail(response));
  const body = (await response.json()) as { message: string };
  return body.message;
}

async function adminRequest<T>(user: User, path: string, init?: RequestInit): Promise<T> {
  if (!apiUrl) throw new Error("API de Helix no configurada");
  const token = await user.getIdToken();
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(organizationId ? { "x-organization-id": organizationId } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) throw new Error(await detail(response));
  return response.json() as Promise<T>;
}

export function listPasswordRecoveryRequests(user: User) {
  return adminRequest<PasswordRecoveryRequest[]>(user, "/password-recovery-requests");
}

export function resolvePasswordRecoveryRequest(user: User, id: string) {
  return adminRequest<PasswordRecoveryRequest>(
    user,
    `/password-recovery-requests/${id}/resolve`,
    { method: "PATCH" },
  );
}
