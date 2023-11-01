import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { AppService } from './app.service';
import { randomUUID } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';

interface Collection {
  name: string;
  channels: string[];
}

@Controller('collections')
export class CollectionsController {
  constructor() {
    // load collections from collections.json
    if (!existsSync('collections.json')) {
      writeFileSync('collections.json', '{}', 'utf-8');
    }
  }

  @Get()
  getCollections(): { [key: string]: Collection } {
    return JSON.parse(readFileSync('collections.json', 'utf-8'));
  }

  @Get(':uuid')
  async getCollectionByUUID(@Param('uuid') uuid: string): Promise<Collection> {
    const collection = JSON.parse(readFileSync('collections.json', 'utf-8'))[
      uuid
    ];
    collection.liveChannels = [];
    const token = await getTwitchToken();
    const channels = await Promise.all(
      collection.channels.map(async (channel) => {
        if (await isStreamerLive(channel, token)) {
          collection.liveChannels.push(channel);
          return channel;
        }
      }),
    );
    console.log(collection);
    return collection;
    //
    // collection.liveChannels = collection.channels.filter((channel) => {
  }

  @Post()
  createNewCollection(): string {
    const collections = JSON.parse(readFileSync('collections.json', 'utf-8'));
    const uuid = randomUUID().toString();
    collections[uuid] = {
      name: '',
      channels: [],
    };
    writeFileSync('collections.json', JSON.stringify(collections), 'utf-8');
    return uuid;
  }

  @Put(':uuid')
  updateCollectionByUUID(
    @Param('uuid') uuid: string,
    @Body() collection: Collection,
  ): void {
    const collections = JSON.parse(readFileSync('collections.json', 'utf-8'));
    collections[uuid] = collection;
    writeFileSync('collections.json', JSON.stringify(collections), 'utf-8');
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
  console.log(data);
  return `Bearer ${data.access_token}`;
}

async function isStreamerLive(username, token) {
  const url = `https://api.twitch.tv/helix/streams?user_login=${username}`;
  const headers = {
    'Client-Id': 'ffro9q623pad2c9695prwzlhwcw9v9',
    Authorization: token,
  };

  const response = await fetch(url, { headers: headers });
  const data = await response.json();

  console.log(data);
  return data?.data?.find((s) => s.user_login === username.toLocaleLowerCase());
}
