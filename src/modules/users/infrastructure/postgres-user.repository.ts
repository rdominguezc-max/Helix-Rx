import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import type { User } from '../domain/user.entity';
import type {
  CreateUserData,
  UpdateUserProfileData,
  UserRepository,
} from '../domain/user.repository';

interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  firebase_uid: string | null;
  email_verified: boolean;
  phone: string | null;
  language: User['language'];
  preferred_locale: string;
  timezone: string;
  status: User['status'];
  last_login_at: Date | null;
  last_activity_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    firebaseUid: row.firebase_uid,
    emailVerified: row.email_verified,
    phone: row.phone,
    language: row.language,
    preferredLocale: row.preferred_locale,
    timezone: row.timezone,
    status: row.status,
    lastLoginAt: row.last_login_at,
    lastActivityAt: row.last_activity_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

const userSelectColumns = `
  id,
  first_name,
  last_name,
  email,
  firebase_uid,
  email_verified,
  phone,
  language,
  preferred_locale,
  timezone,
  status,
  last_login_at,
  last_activity_at,
  created_at,
  updated_at,
  deleted_at
`;

@Injectable()
export class PostgresUserRepository implements UserRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: CreateUserData): Promise<User> {
    const result = await this.databaseService.query<UserRow>(
      `
        INSERT INTO users (
          first_name,
          last_name,
          email,
          firebase_uid,
          email_verified,
          phone,
          language,
          preferred_locale,
          timezone,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING ${userSelectColumns}
      `,
      [
        data.firstName,
        data.lastName,
        data.email,
        data.firebaseUid ?? null,
        data.emailVerified ?? false,
        data.phone ?? null,
        data.language,
        data.preferredLocale ?? 'es-MX',
        data.timezone,
        data.status,
      ],
    );

    return mapUser(result.rows[0]);
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.databaseService.query<UserRow>(
      `
        SELECT ${userSelectColumns}
        FROM users
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [id],
    );

    const row = result.rows[0];

    return row ? mapUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.databaseService.query<UserRow>(
      `
        SELECT ${userSelectColumns}
        FROM users
        WHERE lower(email) = lower($1)
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [email],
    );

    const row = result.rows[0];

    return row ? mapUser(row) : null;
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const result = await this.databaseService.query<UserRow>(
      `
        SELECT ${userSelectColumns}
        FROM users
        WHERE firebase_uid = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [firebaseUid],
    );

    const row = result.rows[0];

    return row ? mapUser(row) : null;
  }

  async linkFirebaseUser(data: {
    userId: string;
    firebaseUid: string;
    emailVerified: boolean;
  }): Promise<User | null> {
    const result = await this.databaseService.query<UserRow>(
      `
        UPDATE users
        SET
          firebase_uid = $2,
          email_verified = $3,
          updated_at = now()
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING ${userSelectColumns}
      `,
      [data.userId, data.firebaseUid, data.emailVerified],
    );

    const row = result.rows[0];

    return row ? mapUser(row) : null;
  }

  async touchLoginActivity(userId: string): Promise<User | null> {
    const result = await this.databaseService.query<UserRow>(
      `
        UPDATE users
        SET
          last_login_at = now(),
          last_activity_at = now(),
          updated_at = now()
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING ${userSelectColumns}
      `,
      [userId],
    );

    const row = result.rows[0];

    return row ? mapUser(row) : null;
  }

  async updateBasicProfile(data: UpdateUserProfileData): Promise<User | null> {
    const result = await this.databaseService.query<UserRow>(
      `
        UPDATE users
        SET
          first_name = $2,
          last_name = $3,
          phone = $4,
          language = $5,
          timezone = $6,
          updated_at = now()
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING ${userSelectColumns}
      `,
      [
        data.userId,
        data.firstName,
        data.lastName,
        data.phone ?? null,
        data.language,
        data.timezone,
      ],
    );

    const row = result.rows[0];

    return row ? mapUser(row) : null;
  }
}
