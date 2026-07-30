import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ProcessDuePushNotificationsUseCase } from '../src/modules/medications/application/process-due-push-notifications.use-case';

async function main(): Promise<void> {
  const application = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const processor = application.get(ProcessDuePushNotificationsUseCase);
    const result = await processor.execute({
      workerId: process.env.NOTIFICATION_WORKER_ID ?? 'push-worker',
      limit: Number(process.env.NOTIFICATION_WORKER_BATCH_SIZE ?? '25'),
      leaseSeconds: Number(process.env.NOTIFICATION_WORKER_LEASE_SECONDS ?? '300'),
    });
    console.log(JSON.stringify(result));
  } finally {
    await application.close();
  }
}

void main();
