import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync } from 'fs';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    rawBody: true,
  });
  const config = app.get(ConfigService);

  // Serve bundled demo florist photos at /demo/* (vendor dashboard + fallback)
  const demoDir = join(process.cwd(), 'assets', 'demo');
  if (existsSync(demoDir)) {
    app.useStaticAssets(demoDir, { prefix: '/demo' });
  }

  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('CORS_ORIGINS')?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
  });

  const prefix = config.get<string>('API_PREFIX') ?? 'api/v1';
  app.setGlobalPrefix(prefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? config.get<number>('PORT') ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`BloomDidi API running on 0.0.0.0:${port}/${prefix}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start BloomDidi API:', err);
  process.exit(1);
});
