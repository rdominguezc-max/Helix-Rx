export type NodeEnvironment = 'development' | 'test' | 'staging' | 'production';

export interface EnvironmentConfig {
  nodeEnv: NodeEnvironment;
  port: number;
  appName: string;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    ssl: boolean;
  };
  firebase: {
    projectId: string | null;
    clientEmail: string | null;
    privateKey: string | null;
  };
  notifications: {
    destinationTokensJson: string | null;
  };
  corsOrigins: string[];
}

const allowedNodeEnvironments = new Set<NodeEnvironment>([
  'development',
  'test',
  'staging',
  'production',
]);

function requireString(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function requireNumber(name: string, fallback?: string): number {
  const rawValue = requireString(name, fallback);
  const value = Number(rawValue);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }

  return value;
}

function requireBoolean(name: string, fallback?: string): boolean {
  const rawValue = requireString(name, fallback).toLowerCase();

  if (rawValue === 'true') {
    return true;
  }

  if (rawValue === 'false') {
    return false;
  }

  throw new Error(`Environment variable ${name} must be true or false`);
}

function optionalString(name: string): string | null {
  const value = process.env[name];

  return value && value.trim().length > 0 ? value.trim() : null;
}

function requireNodeEnvironment(): NodeEnvironment {
  const value = requireString('NODE_ENV', 'development') as NodeEnvironment;

  if (!allowedNodeEnvironments.has(value)) {
    throw new Error(`Unsupported NODE_ENV: ${value}`);
  }

  return value;
}

export function loadEnvironment(): EnvironmentConfig {
  return {
    nodeEnv: requireNodeEnvironment(),
    port: requireNumber('PORT', '3000'),
    appName: requireString('APP_NAME', 'helix'),
    database: {
      host: requireString('DATABASE_HOST', 'localhost'),
      port: requireNumber('DATABASE_PORT', '5432'),
      user: requireString('DATABASE_USER', 'helix'),
      password: requireString('DATABASE_PASSWORD', 'helix_dev_password'),
      name: requireString('DATABASE_NAME', 'helix_dev'),
      ssl: requireBoolean('DATABASE_SSL', 'false'),
    },
    firebase: {
      projectId: optionalString('FIREBASE_PROJECT_ID'),
      clientEmail: optionalString('FIREBASE_CLIENT_EMAIL'),
      privateKey: optionalString('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n') ?? null,
    },
    notifications: {
      destinationTokensJson: optionalString('NOTIFICATION_DESTINATION_TOKENS_JSON'),
    },
    corsOrigins: (optionalString('CORS_ORIGINS') ?? 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}
