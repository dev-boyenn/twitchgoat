import { useState, useEffect, useCallback } from "react";
import { fetchLiveRuns, fetchPbTime } from "./pacemanService";
import { processRunData, getAdjustedTime } from "./pacemanUtils";

/**
 * Custom hook for managing PaceMan data
 * @param {Object} settings - User settings
 * @returns {Object} PaceMan data and functions
 */
export const usePacemanData = (settings) => {
  const [liveChannels, setLiveChannels] = useState([]);
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
  useEffect(() => {
    async function getPaceChannels() {
      try {
        const data = await fetchLiveRuns();

        const liveRuns = data.filter(
          (run) => run.user.liveAccount != null && run.isHidden === false
        );
        const hiddenRuns = data.filter(
          (run) => run.user.liveAccount != null && run.isHidden === true
        );

        // Map runs with basic info first
        const runsWithBasicInfo = liveRuns.map(processRunData);

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

        // Sort runs by adjusted time
        const orderedRuns = runsWithPb.sort((a, b) => {
          return (
            getAdjustedTime(a.split, a.time) - getAdjustedTime(b.split, b.time)
          );
        });

        // Use the minimum total channels setting (defaulting to 3)
        const minChannels = settings.minTotalChannels || 3;
        if (orderedRuns.length < minChannels) {
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
                pb: channelData.pb,
              });
            }
          });
        }

        // If its still less than the minimum channels, add some hidden runs
        if (orderedRuns.length < minChannels) {
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

        if (channelsChanged) {
          // Store the full run data including split and time information
          console.log("Setting live channels:", limitedRuns);
          setLiveChannels(limitedRuns);
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

  return {
    liveChannels,
    hiddenChannels,
    focussedChannels,
    setFocussedChannels,
    onToggleHideChannel,
  };
};

export default usePacemanData;
