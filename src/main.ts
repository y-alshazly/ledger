import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';

import { AppModule } from './app/app.module';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const globalPrefix = 'api/';
  const port = (configService.get('PORT') as number) || 5001;

  app.setGlobalPrefix(globalPrefix);
  app.use(cookieParser());
  app.use(morgan('combined', { stream: { write: message => Logger.log(message.trim()) } }));
  app.use(helmet());
  app.enableCors({
    credentials: true,
    origin: ['http://localhost:3001', '*'],
    methods: ['GET', 'POST', 'Patch', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  await app.listen(port);

  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`, bootstrap.name);
};

void bootstrap();
