import { Injectable } from '@nestjs/common';
import QueryLogDto from './dto/QueryLogDto';
import { ConfigService } from '@nestjs/config';
import { createReadStream, ReadStream } from 'fs';

@Injectable()
export class AppService {
  private readonly path = this.configService.get<string>('APP_LOG_PATH');

  constructor(private configService: ConfigService) {}
  getLogsByDate(queryLogDto: QueryLogDto): ReadStream {
    const file = queryLogDto.date;
    return createReadStream(this.path + file + '.log');
  }
}
