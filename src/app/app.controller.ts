import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('v1/core/app')
export class AppController {
  @HttpCode(HttpStatus.OK)
  @Get('memory-usage')
  getMemoryUsage() {
    return process?.memoryUsage();
  }
}
