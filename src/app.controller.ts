import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health/db')
  async getDbHealth() {
    const ready = await this.prisma.isDbReady();
    return {
      status: ready ? 'ok' : 'error',
      database: ready ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
    };
  }
}
