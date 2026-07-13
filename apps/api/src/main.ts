import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { applyConfig } from '@ce/nestjs-shared-core';
import { AppModule } from './app.module';
import { Configkey } from './shared/config-keys';

async function main() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  applyConfig(app as never, {
    globalPrefix: 'api',
    environment:
      config.get<string>(Configkey.ENVIRONMENT) ??
      config.get<string>(Configkey.NODE_ENV),
    appName: config.get<string>(Configkey.APP_NAME) ?? 'nestjs-consumer-app',
    corsOrigins: config.get<string>(Configkey.CORS_ALLOWED_ORIGIN)?.split(','),
    logLevel:
      (config.get<string>(Configkey.LOG_LEVEL) as
        | 'log'
        | 'verbose'
        | 'debug'
        | 'warn'
        | 'error'
        | 'fatal'
        | undefined) ?? 'log',
    helmet: true,
    enableSwagger: 'auto',
    swaggerOptions: {
      title: 'Consumer App API',
      description: 'NestJS consumer application built on nestjs-shared',
      version: '1.0',
    },
    trustProxy: true,
  });

  const port = Number.parseInt(config.get<string>('PORT') ?? '3000', 10);
  await app.listen(port);
}

main();
