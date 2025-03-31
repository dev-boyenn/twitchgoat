import { Injectable, Logger } from '@nestjs/common';
import * as cache from 'memory-cache';

interface PBEntry {
  finish: number; // PB time in milliseconds
  uuid: string;
  timestamp: number;
  name: string;
  pb: string; // Formatted time (e.g. "7:01")
}

@Injectable()
export class PacemanService {
  private readonly logger = new Logger(PacemanService.name);
  private pbsCache: PBEntry[] | null = null;
  private pbsCacheTime = 0;
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

  /**
   * Get the personal best time for a runner
   * @param username The username of the runner
   * @returns The personal best time in seconds, or null if not found
   */
  async getPersonalBest(username: string): Promise<number | null> {
    try {
      // Check cache first for this specific username
      const cacheKey = `pb_${username.toLowerCase()}`;
      const cachedPb = cache.get(cacheKey);
      if (cachedPb !== null) {
        return cachedPb;
      }

      // Fetch the PBs if we don't have them cached or if the cache is expired
      if (!this.pbsCache || Date.now() - this.pbsCacheTime > this.CACHE_TTL) {
        await this.fetchPBs();
      }

      // If we still don't have the PBs, return null
      if (!this.pbsCache) {
        return null;
      }

      // Find the player in the PBs list
      const playerEntry = this.pbsCache.find(
        (entry) => entry.name.toLowerCase() === username.toLowerCase(),
      );

      if (!playerEntry) {
        // Cache negative result for a shorter time (5 minutes)
        cache.put(cacheKey, null, 5 * 60 * 1000);
        return null;
      }

      // Convert from milliseconds to seconds
      const pbInSeconds = playerEntry.finish / 1000;

      // Cache the result for 1 hour
      cache.put(cacheKey, pbInSeconds, this.CACHE_TTL);

      return pbInSeconds;
    } catch (error) {
      this.logger.error(`Error fetching PB for ${username}:`, error);
      return null;
    }
  }

  /**
   * Fetch the personal best times from the paceman.gg API
   * @returns Promise<void>
   */
  private async fetchPBs(): Promise<void> {
    try {
      this.logger.log('Fetching PBs from paceman.gg API');

      const response = await fetch('https://paceman.gg/stats/api/getPBs/', {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'TwitchGoat/1.0',
        },
      });

      if (!response.ok) {
        this.logger.error(`Failed to fetch PBs: ${response.statusText}`);
        return;
      }

      const data = await response.json();

      if (!data || !Array.isArray(data) || data.length === 0) {
        this.logger.error('PBs data is empty or invalid');
        return;
      }

      this.pbsCache = data;
      this.pbsCacheTime = Date.now();
      this.logger.log(`PBs fetched successfully with ${data.length} entries`);
    } catch (error) {
      this.logger.error('Error fetching PBs:', error);
    }
  }
}
