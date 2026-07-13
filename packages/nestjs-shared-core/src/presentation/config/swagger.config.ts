import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PagedResponse } from '../models/paged-response';
import { ErrorResponse, SuccessResponse } from '../models/response-model';

export interface SwaggerOptions {
  title?: string;
  description?: string;
  version?: string;
  extraModels?: any[];
}

export function configureSwagger(app: INestApplication, options: SwaggerOptions = {}) {
  const title = options.title ?? 'API Documentation';
  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(options.description ?? `${title} powered by NestJS`)
    .setVersion(options.version ?? '1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'jwt',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-Api-Key',
        description: 'API Key needed to access the endpoints',
      },
      'api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [
      SuccessResponse,
      ErrorResponse,
      PagedResponse,
      ...(options.extraModels ?? []),
    ],
    deepScanRoutes: true,
  });

  // Post-process document to add permissions to description
  Object.values(document.paths).forEach((pathItem) => {
    Object.keys(pathItem).forEach((method) => {
      if (
        ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)
      ) {
        const operation: any = pathItem[method];
        if (operation && operation['x-required-permissions']) {
          const permissions = operation['x-required-permissions'] as string[];
          const requireAll = operation['x-require-all-permissions'] === true;

          if (Array.isArray(permissions) && permissions.length > 0) {
            const permissionList = permissions.map((p) => `- \`${p}\``).join('\n');
            const suffix = requireAll
              ? '\n_(All permissions required)_'
              : '\n_(Any of these permissions)_';

            const permissionText = `\n\n**Required Permissions:**\n${permissionList}${suffix}`;
            operation.description = (operation.description || '') + permissionText;
          }
        }
      }
    });
  });

  SwaggerModule.setup('swagger-ui', app, document, {
    jsonDocumentUrl: 'api/docs',
  });
}
