import { useState, useEffect, useCallback, useRef } from "react";
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

  useEffect(() => {
    async function getPaceChannels() {
      try {
        const data = await fetchLiveRuns();

        // Parse filtered runners
        const filteredRunnersList = parseFilteredRunners(
          settings.filteredRunners
        );

        // Log the filtered runners list
        if (filteredRunnersList.length > 0) {
          console.log("Filtering runners by:", filteredRunnersList);
        }

        // Filter live runs
        let liveRuns = data.filter(
          (run) => run.user.liveAccount != null && run.isHidden === false
        );

        let hiddenRuns = data.filter(
          (run) => run.user.liveAccount != null && run.isHidden === true
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

          // If no runners match the filter, don't show any
          if (liveRuns.length === 0 && hiddenRuns.length === 0) {
            console.log("No runners match the filter, showing empty grid");
            setLiveChannels([]);
            setFocussedChannels([]);
            return;
          }
        }

        // Map runs with basic info first
        let runsWithBasicInfo = liveRuns.map(processRunData);

        // Fetch PB times for each runner
        const pbPromises = runsWithBasicInfo.map(async (run) => {
          // Use Minecraft nickname if available, otherwise use Twitch name
          const nameForPb = run.minecraftName || run.name;
          console.log(`Fetching PB for ${nameForPb}...`);
          const pb = await fetchPbTime(nameForPb);
          console.log(`PB for ${nameForPb}: ${pb}`);
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

        // Use the minimum total channels setting (defaulting to 3)
        const minChannels = settings.minTotalChannels || 3;

        // Only add previous channels if we're not filtering or if they match the filter
        if (
          orderedRuns.length < minChannels &&
          filteredRunnersList.length === 0
        ) {
          liveChannels.forEach((channelData) => {
            if (
              !orderedRuns.find(
                (run) => run.liveAccount === channelData.liveAccount
              ) &&
              orderedRuns.length < minChannels
            ) {
              orderedRuns.push({
                liveAccount: channelData.liveAccount,
                name: channelData.name || channelData.liveAccount,
                minecraftName: channelData.minecraftName,
                split: channelData.split,
                time: channelData.time,
                lastUpdated: channelData.lastUpdated,
                pb: channelData.pb,
              });
            }
          });
        }

        // If its still less than the minimum channels, add some hidden runs
        // Only do this if we're not filtering or if the hidden runs match the filter
        if (
          orderedRuns.length < minChannels &&
          (filteredRunnersList.length === 0 || hiddenRuns.length > 0)
        ) {
          for (const run of hiddenRuns) {
            if (
              !orderedRuns.find((r) => r.liveAccount === run.user.liveAccount)
            ) {
              const name = run.user.username || run.user.liveAccount;
              const minecraftName = run.nickname; // This is the Minecraft account name
              const nameForPb = minecraftName || name;
              const pb = await fetchPbTime(nameForPb);

              orderedRuns.push({
                liveAccount: run.user.liveAccount,
                name,
                minecraftName,
                split: null,
                time: null,
                lastUpdated: run.lastUpdated,
                pb,
              });

              if (orderedRuns.length >= minChannels) break;
            }
          }
        }

        // Limit total channels based on setting (defaulting to 10)
        const maxTotal = settings.maxTotalChannels || 10;
        const limitedRuns = orderedRuns.slice(0, maxTotal);

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
  }, [liveChannels, settings]);

  // Update estimated times and scores every second
  useEffect(() => {
    if (lastFetchedChannels.length === 0) return;

    const updateInterval = setInterval(() => {
      const currentTimestamp = Date.now();

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

        // Calculate elapsed time since last update
        const elapsedMs = currentTimestamp - channel.lastUpdated;
        const newEstimatedTime = channel.time + elapsedMs / 1000;

        // Get the next split
        const nextSplit = channel.debugInfo.nextSplit;

        if (!nextSplit) {
          return channel;
        }

        // Recalculate the next split score
        const goodSplitTime =
          channel.debugInfo.goodSplitTime ||
          (nextSplit === "NETHER"
            ? 90
            : nextSplit === "S1"
            ? 120
            : nextSplit === "S2"
            ? 240
            : nextSplit === "BLIND"
            ? 300
            : nextSplit === "STRONGHOLD"
            ? 400
            : nextSplit === "END ENTER"
            ? 420
            : nextSplit === "FINISH"
            ? 600
            : 300);

        const progressionBonus =
          channel.debugInfo.progressionBonus ||
          (nextSplit === "NETHER"
            ? -0.1
            : nextSplit === "S1"
            ? 0.1
            : nextSplit === "S2"
            ? 0.7
            : nextSplit === "BLIND"
            ? 0.8
            : nextSplit === "STRONGHOLD"
            ? 0.85
            : nextSplit === "END ENTER"
            ? 0.9
            : nextSplit === "FINISH"
            ? 1.0
            : 0.5);

        // Calculate the score for the next split using the updated time
        const nextSplitTimeFactor = newEstimatedTime / goodSplitTime;
        const newNextSplitScore = nextSplitTimeFactor - progressionBonus;

        // Determine which split to use for ranking
        const useNextSplit =
          newNextSplitScore > channel.debugInfo.currentSplitScore;
        const finalScore = Math.max(
          channel.debugInfo.currentSplitScore,
          newNextSplitScore
        );

        // Update the debug info
        const updatedDebugInfo = {
          ...channel.debugInfo,
          estimatedTime: newEstimatedTime,
          nextSplitScore: newNextSplitScore,
          score: finalScore,
          usedSplit: useNextSplit ? nextSplit : channel.split,
        };

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
