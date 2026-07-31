import type { User } from "firebase/auth";

const apiUrl = process.env.NEXT_PUBLIC_HELIX_API_URL;
const organizationId = process.env.NEXT_PUBLIC_HELIX_ORGANIZATION_ID;
const patientId = process.env.NEXT_PUBLIC_HELIX_PATIENT_ID;
const treatmentId = process.env.NEXT_PUBLIC_HELIX_TREATMENT_ID;

export const liveApiConfigured = Boolean(
  apiUrl && organizationId && patientId && treatmentId,
);

async function request<T>(
  user: User,
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!apiUrl || !organizationId) throw new Error("API de Helix no configurada");
  const token = await user.getIdToken();
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-organization-id": organizationId,
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.message ?? `La API respondió ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function recordDoseTaken(user: User, scheduledFor: string) {
  if (!patientId || !treatmentId) throw new Error("Tratamiento no configurado");
  return request(
    user,
    `/patients/${patientId}/treatments/${treatmentId}/dose-events`,
    {
      method: "POST",
      body: JSON.stringify({
        scheduledFor,
        occurredAt: new Date().toISOString(),
        eventStatus: "taken",
        idempotencyKey: `web-${treatmentId}-${scheduledFor}`,
      }),
    },
  );
}
