export type HealthStatus = 'ok';
export type DependencyHealthStatus = 'ok' | 'error';

export interface DependencyHealth {
  status: DependencyHealthStatus;
}

export interface HealthCheckResponse {
  status: HealthStatus;
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  database: DependencyHealth;
}
