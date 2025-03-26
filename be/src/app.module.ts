import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PacemanModule } from './paceman.module';
import { CollectionsModule } from './collections.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://dev-boyenn:twitchgoat12@twitchgoat.nd575zv.mongodb.net/?retryWrites=true&w=majority',
    ),
    PacemanModule,
    CollectionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
