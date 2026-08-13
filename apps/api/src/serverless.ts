import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';

let cachedApp: Awaited<ReturnType<typeof createApp>> | null = null;

async function createApp() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: (config.get<string>('ALLOWED_ORIGINS') ?? '').split(',').filter(Boolean),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.setGlobalPrefix('api/v1');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('BUET Prep AI API')
    .setDescription('Backend for the BUET Prep AI independent preparation platform')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  return app;
}

export default async function handler(req: Request, res: Response) {
  const app = cachedApp ?? (cachedApp = await createApp());
  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(req, res);
}
