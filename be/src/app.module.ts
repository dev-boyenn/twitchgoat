import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CollectionsController } from './collections.controller';

@Module({
  imports: [],
  controllers: [AppController, CollectionsController],
  providers: [AppService],
})
export class AppModule {}
