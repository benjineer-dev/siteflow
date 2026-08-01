import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
  .setTitle('SiteFlow API')
  .setDescription(
    'API for construction issue tracking and workflow management.',
  )
  .setVersion('0.1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
    'access-token',
  )
  .build();

  const swaggerDocument = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  app.use(
    '/docs',
    apiReference({
      content: swaggerDocument,

      theme: 'deepSpace',
      layout: 'modern',
      darkMode: true,

      showOperationId: true,
      modelsSectionLabel: `DTO`,
      defaultHttpClient: {
        targetKey: 'js',
        clientKey: 'fetch',
      },

      metaData: {
        title: 'SiteFlow API Documentation',
        description: 'SiteFlow Backend API Documentation',
      },

      customCss: `
        .references-layout {
          --scalar-radius: 10px;
          --scalar-radius-lg: 14px;
          --scalar-radius-xl: 18px;
        }

        .sidebar {
          backdrop-filter: blur(16px);
        }

        .section-header {
          letter-spacing: -0.02em;
        }
      `,
    }),
  );


  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();