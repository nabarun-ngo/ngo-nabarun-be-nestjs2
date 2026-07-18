import 'reflect-metadata';
import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { applyConfig } from '@ce/nestjs-shared-core';
import { AppModule } from './app.module';
import { Configkey } from './shared/config-keys';

async function main() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  applyConfig(app, {
    globalPrefix: 'api',
    globalPrefixExclusions: [{ path: 'newsletter', method: RequestMethod.POST }],
    environment: config.getOrThrow<string>(Configkey.NODE_ENV),
    appName: `${config.get<string>(Configkey.APP_NAME) ?? 'NestJS'} API`,
    corsOrigins: config.get<string>(Configkey.CORS_ALLOWED_ORIGIN)?.split(','),
    logLevel: config.get<'log' | 'verbose' | 'debug' | 'warn' | 'error' | 'fatal'>(Configkey.LOG_LEVEL) ?? 'error',
    helmet: true,
    enableSwagger: 'auto',
    swaggerOptions: {
      title: `${config.get<string>(Configkey.APP_NAME) ?? 'NestJS'} API`,
      description: `${config.get<string>(Configkey.APP_NAME) ?? 'NestJS'} application backend`,
      version: '1.0',
    },
    trustProxy: true,
  });

  const port = Number.parseInt(config.get<string>('PORT') ?? '8080', 10);
  await app.listen(port);
}

main();
