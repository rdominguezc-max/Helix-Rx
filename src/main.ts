import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('port');

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: configService.getOrThrow<string[]>('corsOrigins'),
    methods: ['GET', 'POST', 'PUT', 'PATCH'],
    allowedHeaders: ['authorization', 'content-type', 'x-organization-id'],
  });

  await app.listen(port);
}

void bootstrap();
