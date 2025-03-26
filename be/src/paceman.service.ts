import { Injectable, Logger } from '@nestjs/common';
import * as cache from 'memory-cache';

interface LeaderboardEntry {
  uuid: string;
  name: string;
  value: number; // PB time in milliseconds
  qty: number;
  avg: number;
}

@Injectable()
export class PacemanService {
  private readonly logger = new Logger(PacemanService.name);
  private leaderboardCache: LeaderboardEntry[] | null = null;
  private leaderboardCacheTime = 0;
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

      // Fetch the leaderboard if we don't have it cached or if the cache is expired
      if (
        !this.leaderboardCache ||
        Date.now() - this.leaderboardCacheTime > this.CACHE_TTL
      ) {
        await this.fetchLeaderboard();
      }

      // If we still don't have the leaderboard, return null
      if (!this.leaderboardCache) {
        return null;
      }

      // Find the player in the leaderboard
      const playerEntry = this.leaderboardCache.find(
        (entry) => entry.name.toLowerCase() === username.toLowerCase(),
      );

      if (!playerEntry) {
        // Cache negative result for a shorter time (5 minutes)
        cache.put(cacheKey, null, 5 * 60 * 1000);
        return null;
      }

      // Convert from milliseconds to seconds
      const pbInSeconds = playerEntry.value / 1000;

      // Cache the result for 1 hour
      cache.put(cacheKey, pbInSeconds, this.CACHE_TTL);

      return pbInSeconds;
    } catch (error) {
      this.logger.error(`Error fetching PB for ${username}:`, error);
      return null;
    }
  }

  /**
   * Fetch the leaderboard from the paceman.gg API
   * @returns Promise<void>
   */
  private async fetchLeaderboard(): Promise<void> {
    try {
      this.logger.log('Fetching leaderboard from paceman.gg API');

      const response = await fetch(
        'https://paceman.gg/stats/api/getLeaderboard/?category=finish&type=fastest&days=99999&limit=10000',
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'TwitchGoat/1.0',
          },
        },
      );

      if (!response.ok) {
        this.logger.error(
          `Failed to fetch leaderboard: ${response.statusText}`,
        );
        return;
      }

      const data = await response.json();

      if (!data || !Array.isArray(data) || data.length === 0) {
        this.logger.error('Leaderboard data is empty or invalid');
        return;
      }

      this.leaderboardCache = data;
      this.leaderboardCacheTime = Date.now();
      this.logger.log(
        `Leaderboard fetched successfully with ${data.length} entries`,
      );
    } catch (error) {
      this.logger.error('Error fetching leaderboard:', error);
    }
  }
}
