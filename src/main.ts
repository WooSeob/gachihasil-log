import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = (await NestFactory.create<NestExpressApplication>(AppModule))
    .useStaticAssets(join(__dirname, '..', 'static/public'), {
      prefix: '/static/',
    })
    .setBaseViewsDir(join(__dirname, '..', 'static/views'))
    .setViewEngine('hbs');

  await app.listen(3000);
}
bootstrap();
