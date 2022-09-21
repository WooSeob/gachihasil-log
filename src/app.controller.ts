import { Controller, Get, Param, Render, StreamableFile, UseGuards } from "@nestjs/common";
import { AppService } from './app.service';
import QueryLogDto from './dto/QueryLogDto';
import { BasicAuthGuard } from './basic.guard';
import { Builder } from 'builder-pattern';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Get('/')
  @Render('index')
  async mainPage() {
    return {};
  }

  @UseGuards(BasicAuthGuard)
  @Get('/stream/')
  async getTodayLog() {
    const queryLogDto = Builder<QueryLogDto>()
      .date(new Date().toISOString().substring(0, 10))
      .build();
    return new StreamableFile(this.appService.getLogsByDate(queryLogDto));
  }

  @UseGuards(BasicAuthGuard)
  @Get('/stream/:date')
  async getLogsByDate(@Param('date') date: string) {
    const queryLogDto = Builder<QueryLogDto>().date(date).build();
    return new StreamableFile(this.appService.getLogsByDate(queryLogDto));
  }
}
