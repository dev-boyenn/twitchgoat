import React, { useState, useEffect, useCallback, useRef } from "react";
import { fetchLiveRuns, fetchPbTime } from "./pacemanService";
import { processRunData, getAdjustedTime } from "./pacemanUtils";

/**
 * Custom hook for managing PaceMan data
 * @param {Object} settings - User settings
 * @returns {Object} PaceMan data and functions
 */
export const usePacemanData = (settings) => {
  const [liveChannels, setLiveChannels] = useState([]);
  const [lastFetchedChannels, setLastFetchedChannels] = useState([]);
  const [hiddenChannels, setHiddenChannels] = useState(
    JSON.parse(window.localStorage.getItem("hiddenChannels")) || []
  );
  const [focussedChannels, setFocussedChannels] = useState([]);

  // Create a ref to store PB cache that persists between renders but doesn't trigger re-renders
  const pbCache = useRef({});

  // Cache expiration time (1 hour in milliseconds)
  const PB_CACHE_TTL = 60 * 60 * 1000;

  // Cache stats
  const cacheStats = useRef({
    hits: 0,
    misses: 0,
    get hitRate() {
      const total = this.hits + this.misses;
      return total > 0 ? ((this.hits / total) * 100).toFixed(1) + "%" : "0%";
    },
  });

  // Save hidden channels to localStorage when they change
  useEffect(() => {
    window.localStorage.setItem(
      "hiddenChannels",
      JSON.stringify(hiddenChannels)
    );
  }, [hiddenChannels]);

  // Toggle channel hide state
  const onToggleHideChannel = useCallback(
    (channelName) => {
      if (hiddenChannels.indexOf(channelName) === -1) {
        setHiddenChannels([...hiddenChannels, channelName]);
      } else {
        setHiddenChannels(hiddenChannels.filter((c) => c !== channelName));
      }
    },
    [hiddenChannels]
  );

  // Fetch PaceMan data
  // Function to parse filtered runners from settings
  const parseFilteredRunners = (filteredRunnersText) => {
    if (!filteredRunnersText || filteredRunnersText.trim() === "") {
      return [];
    }

    // Split by lines
    const lines = filteredRunnersText.split("\n");

    // Extract usernames from each line
    return lines
      .map((line) => {
        // Check if line is in PacemanBot format (username:numbers/numbers/etc.)
        const match = line.match(/^([^:]+):/);
        if (match) {
          // Return just the username part
          return match[1].trim();
        }
        // Otherwise, return the whole line (simple format)
        return line.trim();
      })
      .filter((username) => username !== ""); // Remove empty lines
  };

  // Helper function to get PB time with caching
  const getPbTimeWithCache = async (username) => {
    const now = Date.now();

    // Check if we have this PB in our cache and it's not expired
    if (
      pbCache.current[username] !== undefined &&
      pbCache.current[username].timestamp > now - PB_CACHE_TTL
    ) {
      // Cache hit
      cacheStats.current.hits++;
      console.log(
        `🔍 Using cached PB for ${username}: ${pbCache.current[username].value} (Cache hit rate: ${cacheStats.current.hitRate})`
      );
      return pbCache.current[username].value;
    }

    // If not in cache or expired, fetch it
    cacheStats.current.misses++;
    console.log(
      `🔄 Fetching PB for ${username} (not in cache or expired) (Cache hit rate: ${cacheStats.current.hitRate})`
    );
    const pb = await fetchPbTime(username);
    console.log(`✅ PB for ${username}: ${pb}`);

    // Store in cache with timestamp
    pbCache.current[username] = {
      value: pb,
      timestamp: now,
    };

    return pb;
  };

  // Function to clean up expired cache entries
  const cleanupCache = () => {
    const now = Date.now();
    const expiredTime = now - PB_CACHE_TTL;

    // Count before cleanup
    const beforeCount = Object.keys(pbCache.current).length;

    // Remove expired entries
    Object.keys(pbCache.current).forEach((key) => {
      if (pbCache.current[key].timestamp < expiredTime) {
        delete pbCache.current[key];
      }
    });

    // Count after cleanup
    const afterCount = Object.keys(pbCache.current).length;

    if (beforeCount !== afterCount) {
      console.log(
        `🧹 Cleaned up cache: removed ${
          beforeCount - afterCount
        } expired entries. Current cache size: ${afterCount} entries`
      );
    } else if (beforeCount > 0) {
      console.log(
        `📊 Cache status: ${beforeCount} entries, hit rate: ${cacheStats.current.hitRate}`
      );
    }
  };

  // Clean up cache periodically
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupCache, PB_CACHE_TTL / 2);
    return () => clearInterval(cleanupInterval);
  }, []);

  useEffect(() => {
    console.log("🔍 Effect triggered with dependencies:", {
      liveChannelsLength: liveChannels.length,
      settingsChanged: JSON.stringify(settings),
    });

    async function getPaceChannels() {
      try {
        const data = await fetchLiveRuns();

        // Parse filtered runners
        const filteredRunnersList = parseFilteredRunners(
          settings.filteredRunners
        );

        const alwaysShowTwitchAccounts = parseFilteredRunners(
          settings.alwaysShowTwitchAccounts
        );

        // Log the filtered runners list
        if (filteredRunnersList.length > 0) {
          console.log("Filtering runners by:", filteredRunnersList);
        }

        // Filter live runs
        let liveRuns = data.filter(
          (run) =>
            run.user.liveAccount != null &&
            run.isHidden === false &&
            run.isCheated === false
        );

        let hiddenRuns = data.filter(
          (run) =>
            run.user.liveAccount != null &&
            (run.isHidden === true || run.isCheated === true)
        );

        // If we have a filter, apply it to both live and hidden runs
        if (filteredRunnersList.length > 0) {
          // Helper function to check if a run matches the filter
          const matchesFilter = (run) => {
            const isMatch = filteredRunnersList.some(
              (username) =>
                run.nickname &&
                run.nickname.toLowerCase() === username.toLowerCase()
            );
            if (isMatch) {
              console.log(`Runner ${run.nickname} matches filter`);
            }
            return isMatch;
          };

          // Filter both live and hidden runs
          liveRuns = liveRuns.filter(matchesFilter);
          hiddenRuns = hiddenRuns.filter(matchesFilter);


        }

        // Map runs with basic info first
        let runsWithBasicInfo = liveRuns.map(processRunData);

        // Fetch PB times for each runner using cache
        const pbPromises = runsWithBasicInfo.map(async (run) => {
          // Use Minecraft nickname if available, otherwise use Twitch name
          const nameForPb = run.minecraftName || run.name;
          const pb = await getPbTimeWithCache(nameForPb);
          return { ...run, pb };
        });

        // Wait for all PB fetches to complete
        const runsWithPb = await Promise.all(pbPromises);

        // Log the runs with PB times
        console.log("Runs with PB times:", runsWithPb);

        // Get detailed timing information for each run
        const runsWithDetails = runsWithPb.map((run) => {
          const details = getAdjustedTime(
            run.split,
            run.time,
            run.lastUpdated,
            true
          );
          return {
            ...run,
            debugInfo: details, // Add debug information
          };
        });

        // Sort runs by adjusted time, including lastUpdated timestamp
        const orderedRuns = runsWithDetails.sort((a, b) => {
          return a.debugInfo.score - b.debugInfo.score;
        });

        // Use the total channels setting (defaulting to 3)
        const totalChannels = settings.totalChannels || 3;

        let limitedRuns = orderedRuns.slice(0, totalChannels);

        // If its less than the total channels, add some hidden runs
        if (limitedRuns.length < totalChannels) {
          for (const run of hiddenRuns) {
            if (
              !limitedRuns.find((r) => r.liveAccount === run.user.liveAccount)
            ) {
              const name = run.user.username || run.user.liveAccount;
              const minecraftName = run.nickname; // This is the Minecraft account name
              const nameForPb = minecraftName || name;
              const pb = await getPbTimeWithCache(nameForPb);

              limitedRuns.push({
                liveAccount: run.user.liveAccount,
                name,
                minecraftName,
                split: null,
                time: null,
                lastUpdated: run.lastUpdated,
                pb,
              });
              if (limitedRuns.length >= totalChannels) break;
            }
          }
        }
        console.log(settings);
        // If it's still less than the total channels, fill with filtered runners
        if (limitedRuns.length < totalChannels && alwaysShowTwitchAccounts.length > 0)
        {
          for (const username of alwaysShowTwitchAccounts) {
            // Check if this username is already in the limited runs
            if (
              !limitedRuns.find(
                (run) => run.liveAccount.toLowerCase() === username.toLowerCase()
              )
            ) { 
       
              limitedRuns.push({
                liveAccount: username.toLowerCase(),
                name: '',
                minecraftName: '',
              });
            }
          }
        }
        // Check if the liveChannels have changed by comparing liveAccount values, splits, or times
        const currentLiveAccounts = liveChannels.map((ch) => ch.liveAccount);
        const newLiveAccounts = limitedRuns.map((run) => run.liveAccount);

        // Check if the list of channels has changed
        let channelsChanged =
          currentLiveAccounts.length !== newLiveAccounts.length ||
          !currentLiveAccounts.every(
            (value, index) => value === newLiveAccounts[index]
          );

        // Also check if any split or time has changed for existing channels
        if (!channelsChanged) {
          for (let i = 0; i < limitedRuns.length; i++) {
            const newRun = limitedRuns[i];
            const existingRun = liveChannels.find(
              (ch) => ch.liveAccount === newRun.liveAccount
            );

            if (existingRun) {
              // Check if split or time has changed
              if (
                existingRun.split !== newRun.split ||
                existingRun.time !== newRun.time
              ) {
                console.log(
                  `Split or time changed for ${newRun.name}: ${existingRun.split}/${existingRun.time} -> ${newRun.split}/${newRun.time}`
                );
                channelsChanged = true;
                break;
              }
            }
          }
        }

        if (channelsChanged || filteredRunnersList.length > 0) {
          // Store the full run data including split and time information
          console.log("Setting live channels:", limitedRuns);
          setLiveChannels(limitedRuns);
          setLastFetchedChannels(limitedRuns);
          // Limit focussed channels based on setting (defaulting to 1)
          const maxFocussed = settings.maxFocussedChannels || 1;
          setFocussedChannels(
            limitedRuns.slice(0, maxFocussed).map((run) => run.liveAccount)
          );
        }
      } catch (error) {
        console.error("Error fetching pace channels:", error);
      }
    }
    getPaceChannels();
    const interval = setInterval(() => getPaceChannels(), 10000);
    return () => {
      clearInterval(interval);
    };
  }, [settings]);

  // Update estimated times and scores every second
  useEffect(() => {
    if (lastFetchedChannels.length === 0) return;

    const updateInterval = setInterval(() => {
      // Update each channel's estimated time and recalculate scores
      const updatedChannels = lastFetchedChannels.map((channel) => {
        if (
          !channel.split ||
          !channel.time ||
          !channel.lastUpdated ||
          !channel.debugInfo
        ) {
          return channel;
        }

        // Get the next split
        const nextSplit = channel.debugInfo.nextSplit;

        if (!nextSplit) {
          return channel;
        }

        const updatedDebugInfo = getAdjustedTime(
          channel.split,
          channel.time,
          channel.lastUpdated,
          true
        );

        return {
          ...channel,
          debugInfo: updatedDebugInfo,
        };
      });

      // Sort the updated channels by their new scores
      const sortedChannels = [...updatedChannels].sort((a, b) => {
        if (!a.debugInfo || !b.debugInfo) return 0;
        return a.debugInfo.score - b.debugInfo.score;
      });

      // Update the live channels
      setLiveChannels(sortedChannels);
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [lastFetchedChannels]);

  return {
    liveChannels,
    hiddenChannels,
    focussedChannels,
    setFocussedChannels,
    onToggleHideChannel,
  };
};

export default usePacemanData;
