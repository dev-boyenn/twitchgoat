import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CollectionsController } from './collections.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectionsModule } from './collections.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://dev-boyenn:twitchgoat12@twitchgoat.nd575zv.mongodb.net/?retryWrites=true&w=majority'),
    CollectionsModule
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
