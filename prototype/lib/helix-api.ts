import type { User } from "firebase/auth";

const apiUrl = process.env.NEXT_PUBLIC_HELIX_API_URL;
const organizationId = process.env.NEXT_PUBLIC_HELIX_ORGANIZATION_ID;
const patientId = process.env.NEXT_PUBLIC_HELIX_PATIENT_ID;
const treatmentId = process.env.NEXT_PUBLIC_HELIX_TREATMENT_ID;

export const liveApiConfigured = Boolean(
  apiUrl && organizationId && patientId && treatmentId,
);

export interface DashboardDose {
  id: string;
  scheduledFor: string;
  status: "scheduled" | "fulfilled" | "cancelled" | "missed";
}

export interface DashboardData {
  medicationName: string;
  doseLabel: string;
  adherenceRate: number | null;
  estimatedDaysRemaining: number | null;
  riskLevel: string;
  doses: DashboardDose[];
}

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

export async function loadTodayDashboard(user: User): Promise<DashboardData> {
  if (!patientId || !treatmentId) throw new Error("Tratamiento no configurado");
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [treatments, medications, insight, doses] = await Promise.all([
    request<Array<{
      id: string;
      medicationId: string;
      doseAmount: number;
      doseUnit: string;
    }>>(user, `/patients/${patientId}/treatments`),
    request<Array<{ id: string; genericName: string }>>(user, "/medications"),
    request<{
      adherence: { adherenceRate: number | null };
      inventory: {
        estimatedDaysRemaining: number | null;
        riskLevel: string;
      };
    }>(user, `/patients/${patientId}/treatments/${treatmentId}/insight`),
    request<DashboardDose[]>(
      user,
      `/patients/${patientId}/treatments/${treatmentId}/expected-doses?windowStartsAt=${encodeURIComponent(start.toISOString())}&windowEndsAt=${encodeURIComponent(end.toISOString())}`,
    ),
  ]);
  const treatment = treatments.find((item) => item.id === treatmentId);
  const medication = medications.find(
    (item) => item.id === treatment?.medicationId,
  );

  return {
    medicationName: medication?.genericName ?? "Medicamento",
    doseLabel: treatment
      ? `${treatment.doseAmount} ${treatment.doseUnit}`
      : "Dosis indicada",
    adherenceRate: insight.adherence.adherenceRate,
    estimatedDaysRemaining: insight.inventory.estimatedDaysRemaining,
    riskLevel: insight.inventory.riskLevel,
    doses,
  };
}
