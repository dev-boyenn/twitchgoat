import { Injectable, Logger } from '@nestjs/common';
import * as cache from 'memory-cache';

interface PBEntry {
  finish: number; // PB time in milliseconds
  uuid: string;
  timestamp: number;
  name: string;
  pb: string; // Formatted time (e.g. "7:01")
}

interface Event {
  vanity: string;
  whitelist: string[];
}

interface TwitchStatus {
  uuid: string;
  liveAccount: string | null;
}

export interface LiveRun {
  worldId: string;
  gameVersion: string;
  eventList: Array<{
    eventId: string;
    rta: number;
    igt: number;
  }>;
  contextEventList: Array<{
    eventId: string;
    rta: number;
    igt: number;
  }>;
  user: {
    uuid: string;
    liveAccount: string | null;
  };
  isCheated: boolean;
  isHidden: boolean;
  numLeaves: number;
  lastUpdated: number;
  itemData: {
    estimatedCounts: Record<string, number>;
    usages: Record<string, number>;
  };
  nickname: string;
  pb?: number; // Optional PB time in seconds
}

@Injectable()
export class PacemanService {
  private readonly logger = new Logger(PacemanService.name);
  private pbsCache: PBEntry[] | null = null;
  private pbsCacheTime = 0;
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly EVENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

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

  /**
   * Get all events from paceman.gg API with caching
   * @returns Promise<Event[]>
   */
  private async getEvents(): Promise<Event[]> {
    const cacheKey = 'paceman_events';
    const cachedEvents = cache.get(cacheKey);

    if (cachedEvents) {
      this.logger.log('Returning cached events');
      return cachedEvents;
    }

    try {
      this.logger.log('Fetching events from paceman.gg API');
      const response = await fetch('https://paceman.gg/api/get-events', {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'TwitchGoat/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }

      const events: Event[] = await response.json();

      // Cache for 5 minutes
      cache.put(cacheKey, events, this.EVENT_CACHE_TTL);
      this.logger.log(`Events fetched and cached: ${events.length} events`);

      return events;
    } catch (error) {
      this.logger.error('Error fetching events:', error);
      throw error;
    }
  }

  /**
   * Get Twitch status for multiple UUIDs
   * @param uuids Array of UUIDs to check
   * @returns Promise<TwitchStatus[]>
   */
  private async getTwitchStatus(uuids: string[]): Promise<TwitchStatus[]> {
    if (!uuids || uuids.length === 0) {
      return [];
    }

    // Create a cache key based on sorted UUIDs
    const cacheKey = `twitch_status_${uuids.sort().join('_')}`;
    const cachedStatus = cache.get(cacheKey);

    if (cachedStatus) {
      this.logger.log('Returning cached Twitch status');
      return cachedStatus;
    }

    try {
      this.logger.log(`Fetching Twitch status for ${uuids.length} UUIDs`);
      const response = await fetch('https://paceman.gg/api/us/twitch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'TwitchGoat/1.0',
        },
        body: JSON.stringify({ uuids }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch Twitch status: ${response.statusText}`,
        );
      }

      const statuses: TwitchStatus[] = await response.json();

      // Cache for 5 minutes
      cache.put(cacheKey, statuses, this.EVENT_CACHE_TTL);
      this.logger.log(
        `Twitch status fetched and cached for ${statuses.length} UUIDs`,
      );

      return statuses;
    } catch (error) {
      this.logger.error('Error fetching Twitch status:', error);
      throw error;
    }
  }

  /**
   * Get the most recent run time for a UUID by fetching from the recent runs API
   * @param uuid The UUID to check
   * @param playerName The player name for the API call
   * @returns Promise<number> The timestamp of the most recent run, or 0 if none found
   */
  private async getMostRecentRunTime(
    uuid: string,
    playerName: string,
  ): Promise<number> {
    try {
      const cacheKey = `recent_run_${uuid}`;
      const cachedTime = cache.get(cacheKey);
      if (cachedTime !== null) {
        return cachedTime;
      }

      const response = await fetch(
        `https://paceman.gg/stats/api/getRecentRuns/?name=${encodeURIComponent(
          playerName,
        )}&hours=99999&limit=1`,
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'TwitchGoat/1.0',
          },
        },
      );

      if (!response.ok) {
        this.logger.warn(
          `Failed to fetch recent runs for ${playerName}: ${response.statusText}`,
        );
        return 0;
      }

      const runs = await response.json();
      const mostRecentTime = runs && runs.length > 0 ? runs[0].time || 0 : 0;

      // Cache for 5 minutes
      cache.put(cacheKey, mostRecentTime, this.EVENT_CACHE_TTL);

      return mostRecentTime;
    } catch (error) {
      this.logger.error(`Error fetching recent runs for ${playerName}:`, error);
      return 0;
    }
  }

  /**
   * Choose the most recent UUID from a list of statuses with the same liveAccount
   * @param statuses Array of TwitchStatus objects with the same liveAccount
   * @param liveAccount The liveAccount name
   * @returns Promise<string> The UUID with the most recent run
   */
  private async getMostRecentUuid(
    statuses: TwitchStatus[],
    liveAccount: string,
  ): Promise<string> {
    let mostRecentUuid = statuses[0].uuid;
    let mostRecentTime = 0;

    for (const status of statuses) {
      // Get player name from PB data
      const pbData = this.pbsCache?.find((entry) => entry.uuid === status.uuid);
      const playerName = pbData?.name;

      // Skip if we don't have a player name to query with
      if (!playerName) {
        this.logger.warn(
          `No player name found for UUID ${status.uuid}, skipping recent run check`,
        );
        continue;
      }

      const runTime = await this.getMostRecentRunTime(status.uuid, playerName);

      if (runTime > mostRecentTime) {
        mostRecentTime = runTime;
        mostRecentUuid = status.uuid;
      }
    }

    this.logger.log(
      `Chose UUID ${mostRecentUuid} for liveAccount ${liveAccount} (most recent run: ${mostRecentTime})`,
    );
    return mostRecentUuid;
  }

  /**
   * Get live runs from paceman.gg API
   * @returns Promise<LiveRun[]>
   */
  private async getLiveRuns(): Promise<LiveRun[]> {
    try {
      this.logger.log('Fetching live runs from paceman.gg API');
      const response = await fetch('https://paceman.gg/api/ars/liveruns', {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'TwitchGoat/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch live runs: ${response.statusText}`);
      }

      const liveRuns: LiveRun[] = await response.json();
      this.logger.log(`Live runs fetched: ${liveRuns.length} runs`);

      return liveRuns;
    } catch (error) {
      this.logger.error('Error fetching live runs:', error);
      throw error;
    }
  }

  /**
   * Get live runs for a specific event, including whitelisted runners who are live but not on pace
   * @param eventId The event ID (vanity)
   * @returns Promise<LiveRun[]>
   */
  async getEventLiveRuns(eventId: string): Promise<LiveRun[]> {
    try {
      // Get all events to find the whitelist for this event
      const events = await this.getEvents();
      const event = events.find((e) => e.vanity === eventId);

      if (!event) {
        throw new Error(`Event not found: ${eventId}`);
      }

      // Ensure we have PBs data cached
      if (!this.pbsCache || Date.now() - this.pbsCacheTime > this.CACHE_TTL) {
        await this.fetchPBs();
      }

      // Create a map of UUID to PB data for quick lookup
      const pbMap = new Map<string, PBEntry>();
      if (this.pbsCache) {
        this.pbsCache.forEach((entry) => {
          pbMap.set(entry.uuid, entry);
        });
      }

      // Get Twitch status for all whitelisted runners
      const twitchStatuses = await this.getTwitchStatus(event.whitelist);

      // Create a map for quick lookup, handling duplicate liveAccounts by choosing the most recent UUID
      const twitchStatusMap = new Map<string, string | null>();

      // Group statuses by liveAccount to handle duplicates
      const liveAccountGroups = new Map<string, TwitchStatus[]>();
      twitchStatuses.forEach((status) => {
        if (status.liveAccount) {
          if (!liveAccountGroups.has(status.liveAccount)) {
            liveAccountGroups.set(status.liveAccount, []);
          }
          liveAccountGroups.get(status.liveAccount)!.push(status);
        } else {
          // Add null liveAccount entries directly
          twitchStatusMap.set(status.uuid, status.liveAccount);
        }
      });

      // For each liveAccount with multiple UUIDs, choose the one with the most recent run
      for (const [liveAccount, statuses] of liveAccountGroups) {
        if (statuses.length === 1) {
          // No conflict, add directly
          twitchStatusMap.set(statuses[0].uuid, liveAccount);
        } else {
          // Multiple UUIDs for the same liveAccount, choose the most recent one
          const mostRecentUuid = await this.getMostRecentUuid(
            statuses,
            liveAccount,
          );
          twitchStatusMap.set(mostRecentUuid, liveAccount);
          this.logger.log(
            `Resolved duplicate liveAccount ${liveAccount}: chose UUID ${mostRecentUuid} from ${statuses.length} candidates`,
          );
        }
      }

      // Get all live runs
      const allLiveRuns = await this.getLiveRuns();

      // Filter live runs to only include whitelisted runners
      const whitelistedLiveRuns = allLiveRuns.filter((run) =>
        event.whitelist.includes(run.user.uuid),
      );

      // Create a set of UUIDs that are already in live runs
      const liveRunUuids = new Set(
        whitelistedLiveRuns.map((run) => run.user.uuid),
      );

      // Find whitelisted runners who are live on Twitch but not in live runs (not on pace)
      const additionalLiveRunners: LiveRun[] = [];

      for (const uuid of event.whitelist) {
        const liveAccount = twitchStatusMap.get(uuid);

        // If they're live on Twitch but not in the live runs
        if (liveAccount && !liveRunUuids.has(uuid)) {
          // Get PB data for this runner
          const pbData = pbMap.get(uuid);

          // Create a LiveRun object for runners who are live but not on pace
          // We'll create a minimal structure that matches the LiveRun interface
          additionalLiveRunners.push({
            worldId: `offline-${uuid}`, // Placeholder world ID
            gameVersion: '1.16.1', // Default version
            eventList: [], // No events since they're not on pace
            contextEventList: [],
            user: {
              uuid,
              liveAccount,
            },
            isCheated: false,
            isHidden: false,
            numLeaves: 0,
            lastUpdated: Date.now(),
            itemData: {
              estimatedCounts: {},
              usages: {},
            },
            nickname: pbData?.name || '', // Include player name from PB data
            pb: pbData ? pbData.finish / 1000 : undefined, // Include PB time in seconds
          });
        }
      }

      // Combine whitelisted live runs with additional live runners
      const allEventLiveRuns = [
        ...whitelistedLiveRuns,
        ...additionalLiveRunners,
      ];

      // Update liveAccount info and add PB data for all runs
      allEventLiveRuns.forEach((run) => {
        if (!run.user.liveAccount) {
          run.user.liveAccount = twitchStatusMap.get(run.user.uuid) || null;
        }

        // Add PB data if not already present
        if (!run.pb) {
          const pbData = pbMap.get(run.user.uuid);
          if (pbData) {
            run.pb = pbData.finish / 1000; // Convert milliseconds to seconds
            // Also update nickname if it's empty
            if (!run.nickname) {
              run.nickname = pbData.name;
            }
          }
        }
      });

      this.logger.log(
        `Returning ${allEventLiveRuns.length} live runs for event ${eventId}`,
      );
      return allEventLiveRuns;
    } catch (error) {
      this.logger.error(`Error getting event live runs for ${eventId}:`, error);
      throw error;
    }
  }
}
