import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = (await NestFactory.create<NestExpressApplication>(AppModule))
    .setBaseViewsDir(join(__dirname, '..', 'static/views'))
    .setViewEngine('hbs');

  const port = app.get<ConfigService>(ConfigService).get<string>('PORT');
  await app.listen(port);
}
bootstrap();
