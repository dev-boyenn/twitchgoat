import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PacemanModule } from './paceman.module';

@Module({
  imports: [PacemanModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
