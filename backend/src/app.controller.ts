import { Controller, Get } from '@nestjs/common';
import { Public } from './core/security/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getRoot() {
    return {
      status: 'ok',
      service: 'GariLink API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
