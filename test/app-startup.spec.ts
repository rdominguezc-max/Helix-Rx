import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('Application startup', () => {
  let moduleRef: TestingModule | undefined;
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    if (!app) await moduleRef?.close();
  });

  it('initializes the complete dependency graph', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    expect(moduleRef.get(AppModule)).toBeInstanceOf(AppModule);
  });
});
