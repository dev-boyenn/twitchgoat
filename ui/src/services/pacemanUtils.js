/**
 * Utility functions for PaceMan data processing
 */

// Good split times in seconds
export const goodsplits = {
  NETHER: 90,
  S1: 120,
  S2: 240,
  BLIND: 300,
  STRONGHOLD: 400,
  "END ENTER": 420,
  FINISH: 600, // Added finish split for completed runs
};

// Split order for progression
export const splitOrder = [
  "NETHER",
  "S1",
  "S2",
  "BLIND",
  "STRONGHOLD",
  "END ENTER",
  "FINISH",
];

// Progression bonus values for different splits
export const progressionBonus = {
  NETHER: -0.1,
  S1: 0.1,
  S2: 0.7,
  BLIND: 0.8,
  STRONGHOLD: 0.85,
  "END ENTER": 0.9,
  FINISH: 1.0, // Added finish split bonus
};

/**
 * Calculates the current time based on the lastUpdated timestamp
 * @param {number} lastUpdated - The lastUpdated timestamp from the API
 * @returns {number} The current time in milliseconds
 */
export const calculateCurrentTime = (lastUpdated) => {
  if (!lastUpdated) return 0;

  // Get the current timestamp
  const currentTimestamp = Date.now();

  // Calculate the time difference in milliseconds
  const timeDifference = currentTimestamp - lastUpdated;

  // Return the time difference in milliseconds
  return timeDifference;
};

/**
 * Gets the next split in the progression
 * @param {string} currentSplit - The current split
 * @returns {string|null} The next split or null if there is no next split
 */
export const getNextSplit = (currentSplit) => {
  if (!currentSplit) return null;

  const currentIndex = splitOrder.indexOf(currentSplit);
  if (currentIndex === -1 || currentIndex === splitOrder.length - 1) {
    return null;
  }

  return splitOrder[currentIndex + 1];
};

/**
 * Calculates the adjusted time for a split
 * @param {string} split - The split name
 * @param {number} time - The time in seconds
 * @param {number} lastUpdated - The lastUpdated timestamp from the API
 * @param {boolean} returnDetails - Whether to return detailed information for debugging
 * @returns {number|Object} The adjusted time value or detailed information
 */
export const getAdjustedTime = (
  split,
  time,
  lastUpdated,
  returnDetails = false
) => {
  if (!split || !time) return returnDetails ? { score: Infinity } : Infinity;

  // Calculate how close the time is to the good split time for the current split
  const currentSplitTimeFactor = time / goodsplits[split];
  const currentSplitScore = currentSplitTimeFactor - progressionBonus[split];

  // If there's no lastUpdated timestamp, just return the current split score
  if (!lastUpdated) {
    return returnDetails
      ? {
          score: currentSplitScore,
          usedSplit: split,
          currentTime: time,
          estimatedTime: null,
          nextSplit: null,
        }
      : currentSplitScore;
  }

  // Get the next split in the progression
  const nextSplit = getNextSplit(split);
  if (!nextSplit) {
    return returnDetails
      ? {
          score: currentSplitScore,
          usedSplit: split,
          currentTime: time,
          estimatedTime: null,
          nextSplit: null,
          lastUpdated: lastUpdated,
        }
      : currentSplitScore;
  }

  // Calculate the current time based on the lastUpdated timestamp
  const currentTimeMs = calculateCurrentTime(lastUpdated);
  const estimatedTimeSec = currentTimeMs / 1000 + time; // Add the current split time

  // Calculate the score for the next split using the current time
  const nextSplitTimeFactor = estimatedTimeSec / goodsplits[nextSplit];
  const nextSplitScore = nextSplitTimeFactor - progressionBonus[nextSplit];

  // Determine which split to use for ranking
  const useNextSplit = nextSplitScore > currentSplitScore;
  const finalScore = Math.max(currentSplitScore, nextSplitScore);

  if (returnDetails) {
    return {
      score: finalScore,
      currentSplitScore, // Add current split score
      nextSplitScore, // Add next split score
      usedSplit: useNextSplit ? nextSplit : split,
      currentTime: time,
      estimatedTime: estimatedTimeSec,
      nextSplit: nextSplit,
      lastUpdated: lastUpdated,
      goodSplitTime: goodsplits[nextSplit], // Add good split time for next split
      progressionBonus: progressionBonus[nextSplit], // Add progression bonus for next split
    };
  }

  // Return the worse (higher) score between the current split and the next split
  return finalScore;
};

/**
 * Formats time in minutes:seconds
 * @param {number} seconds - The time in seconds
 * @returns {string} Formatted time string (e.g., "9:34")
 */
export const formatTime = (seconds) => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Processes raw run data from the API into a structured format
 * @param {Object} run - The raw run data from the API
 * @returns {Object} Processed run data
 */
export const processRunData = (run) => {
  const liveAccount = run.user.liveAccount;
  const name = run.user.username || liveAccount; // Use username or fallback to liveAccount
  const minecraftName = run.nickname; // This is the Minecraft account name
  const lastUpdated = run.lastUpdated; // Get the lastUpdated timestamp
  let split = null;
  let time = null;

  if (run.eventList.find((e) => e.eventId === "rsg.enter_end")) {
    split = "END ENTER";
    time = run.eventList.find((e) => e.eventId === "rsg.enter_end").igt;
  } else if (run.eventList.find((e) => e.eventId === "rsg.enter_stronghold")) {
    split = "STRONGHOLD";
    time = run.eventList.find((e) => e.eventId === "rsg.enter_stronghold").igt;
  } else if (run.eventList.find((e) => e.eventId === "rsg.first_portal")) {
    split = "BLIND";
    time = run.eventList.find((e) => e.eventId === "rsg.first_portal").igt;
  } else if (
    run.eventList.find((e) => e.eventId === "rsg.enter_fortress") &&
    run.eventList.find((e) => e.eventId === "rsg.enter_bastion")
  ) {
    split = "S2";
    time = Math.max(
      run.eventList.find((e) => e.eventId === "rsg.enter_fortress").igt,
      run.eventList.find((e) => e.eventId === "rsg.enter_bastion").igt
    );
  } else if (
    run.eventList.find(
      (e) =>
        e.eventId === "rsg.enter_fortress" || e.eventId === "rsg.enter_bastion"
    )
  ) {
    split = "S1";
    time = run.eventList.find(
      (e) =>
        e.eventId === "rsg.enter_fortress" || e.eventId === "rsg.enter_bastion"
    ).igt;
  } else if (run.eventList.find((e) => e.eventId === "rsg.enter_nether")) {
    split = "NETHER";
    time = run.eventList.find((e) => e.eventId === "rsg.enter_nether").igt;
  }

  return {
    liveAccount,
    name,
    minecraftName,
    split,
    time: time ? time / 1000 : null,
    lastUpdated, // Include the lastUpdated timestamp
    pb: null, // Will be populated later
  };
};
