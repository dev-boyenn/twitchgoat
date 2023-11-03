import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { AppService } from './app.service';
import { randomUUID } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { Collections } from './collection.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import memoize from 'fast-memoize';
import * as cache from 'memory-cache';

interface CollectionModel {
  name: string;
  channels: string[];
  uuid: string;
  liveChannels?: string[];
}
@Controller('collections')
export class CollectionsController {
  constructor(
    @InjectModel(Collections.name) private collectionsModel: Model<Collections>,
  ) {}

  @Get()
  async getCollections(): Promise<Collections[]> {
    return await this.collectionsModel.find().exec();
    // return JSON.parse(readFileSync('collections.json', 'utf-8'));
  }

  @Get(':uuid')
  async getCollectionByUUID(
    @Param('uuid') uuid: string,
  ): Promise<CollectionModel> {
    const collection = await this.collectionsModel
      .findOne({ uuid: uuid })
      .exec();

    const collectionModel: CollectionModel = {
      uuid: collection.uuid,
      name: collection.name,
      channels: collection.channels,
      liveChannels: [],
    };

    await Promise.all(
      collectionModel.channels.map(async (channel) => {
        if (await isStreamerLiveCached(channel)) {
          collectionModel.liveChannels.push(channel);
        }
      }),
    );

    collectionModel.liveChannels.sort((a, b) =>
      a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()),
    );
    collectionModel.channels.sort((a, b) =>
      a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()),
    );

    return collectionModel;
  }

  @Post()
  async createNewCollection(): Promise<string> {
    const newModel = await this.collectionsModel.create({
      uuid: randomUUID().toString(),
      name: '',
      channels: [],
    });

    return newModel.uuid;
  }

  @Put(':uuid')
  updateCollectionByUUID(
    @Param('uuid') uuid: string,
    @Body() collection: CollectionModel,
  ): void {
    this.collectionsModel.findOneAndUpdate({ uuid: uuid }, collection).exec();
  }
}

async function getTwitchToken() {
  const client_id = 'ffro9q623pad2c9695prwzlhwcw9v9';
  const client_secret = '3au416ca4hmsqa5hkze4fh648kmsad';
  const grant_type = 'client_credentials';

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `client_id=${client_id}&client_secret=${client_secret}&grant_type=${grant_type}`,
  });

  const data = await response.json();
  return `Bearer ${data.access_token}`;
}

async function getCachedToken() {
  const cachedData = cache.get('token');
  if (cachedData) {
    return cachedData;
  }

  const data = await getTwitchToken();

  cache.put('token', data, 60000); // Cache for 60 seconds

  return data;
}

async function isStreamerLiveCached(username) {
  const cachedData = cache.get(username);
  console.log('cachedData', cachedData);
  if (cachedData !== null) {
    return cachedData;
  }

  const data = await isStreamerLive(username);

  cache.put(username, data, 60000); // Cache for 60 seconds

  return data;
}

async function isStreamerLive(username) {
  try {
    const token = await getCachedToken();
    const url = `https://api.twitch.tv/helix/streams?user_login=${username}`;
    const headers = {
      'Client-Id': 'ffro9q623pad2c9695prwzlhwcw9v9',
      Authorization: token,
    };

    const response = await fetch(url, { headers: headers });
    const data = await response.json();
    console.log(data);
    return !!data?.data?.find(
      (s) => s.user_login === username.toLocaleLowerCase(),
    );
  } catch (err) {
    console.log(err);
  }
}
