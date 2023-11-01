import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CollectionDocument = HydratedDocument<Collections>;

@Schema()
export class Collections {
    @Prop()
    uuid: string;
  @Prop()
  name: string;
  @Prop()
channels: string[];
@Prop()
hiddenChannels: string[];
}

export const CollectionsSchema = SchemaFactory.createForClass(Collections);