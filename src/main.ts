import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './utils/interceptors/response-interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('DOT Articles')
    .setDescription('DOT Articles API Documentation')
    .setVersion('1.0')
    .addServer('/api/v1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/v1/api-list', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
    },
  });

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.setGlobalPrefix('/api/v1');
  await app.listen(3000);
}
bootstrap();
