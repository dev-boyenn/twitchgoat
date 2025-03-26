import { Module } from '@nestjs/common';
import { PacemanController } from './paceman.controller';
import { PacemanService } from './paceman.service';

@Module({
  controllers: [PacemanController],
  providers: [PacemanService],
})
export class PacemanModule {}
