import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectionsController } from './collections.controller';
import { Collections, CollectionsSchema } from './collection.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Collections.name, schema: CollectionsSchema }])],
  controllers: [CollectionsController],
})
export class CollectionsModule {}