import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { DATABASE_POOL } from './database.constants';

export interface DatabaseQueryExecutor {
  query<T extends QueryResultRow>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T>>;
}

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async ping(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  async query<T extends QueryResultRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(sql, params);
  }

  async transaction<T>(
    callback: (executor: DatabaseQueryExecutor) => Promise<T>,
  ): Promise<T> {
    const client: PoolClient = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback({
        query: <TRow extends QueryResultRow>(
          sql: string,
          params: unknown[] = [],
        ): Promise<QueryResult<TRow>> => client.query<TRow>(sql, params),
      });
      await client.query('COMMIT');

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
