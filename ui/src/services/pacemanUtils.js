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
};

// Progression bonus values for different splits
export const progressionBonus = {
  NETHER: -0.1,
  S1: 0.1,
  S2: 0.7,
  BLIND: 0.8,
  STRONGHOLD: 0.85,
  "END ENTER": 0.9,
};

// Order of splits for progression
export const splitOrder = [
  "NETHER",
  "S1",
  "S2",
  "BLIND",
  "STRONGHOLD",
  "END ENTER",
];

/**
 * Gets the next split in the progression
 * @param {string} currentSplit - The current split name
 * @returns {string|null} The next split name, or null if there is no next split
 */
export const getNextSplit = (currentSplit) => {
  if (!currentSplit) return null;

  const currentIndex = splitOrder.indexOf(currentSplit);
  if (currentIndex === -1 || currentIndex === splitOrder.length - 1) {
    return null; // No next split if current split is not found or is the last one
  }

  return splitOrder[currentIndex + 1];
};

/**
 * Calculates the adjusted time for a split
 * @param {string} split - The split name
 * @param {number} time - The time in seconds
 * @param {number} [splitDuration=0] - How long the runner has been in this split (in seconds)
 * @returns {number} The adjusted time value
 */
export const getAdjustedTime = (split, time, splitDuration = 0) => {
  if (!split || !time) return Infinity;

  // Calculate how close the time is to the good split time for current split
  const timeFactor = time / goodsplits[split];
  const currentSplitScore = timeFactor - progressionBonus[split];

  // Check if we should consider the next split
  const nextSplit = getNextSplit(split);
  if (nextSplit && splitDuration > 0) {
    // Estimate time for the next split
    // Current time + how long they've been in this split
    const estimatedNextSplitTime = time + splitDuration;

    // Calculate score for the next split
    const nextSplitTimeFactor = estimatedNextSplitTime / goodsplits[nextSplit];
    const nextSplitScore = nextSplitTimeFactor - progressionBonus[nextSplit];

    // Return the better (lower) score
    return Math.min(currentSplitScore, nextSplitScore);
  }

  // If no next split or no duration info, just return the current split score
  return currentSplitScore;
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
 * @param {Object} [previousRunData=null] - Previous run data for this runner, if available
 * @returns {Object} Processed run data
 */
export const processRunData = (run, previousRunData = null) => {
  const liveAccount = run.user.liveAccount;
  const name = run.user.username || liveAccount; // Use username or fallback to liveAccount
  const minecraftName = run.nickname; // This is the Minecraft account name
  let split = null;
  let time = null;
  let splitDuration = 0;

  // Get the current server time
  const currentTimestamp = Date.now();

  // Determine the current split and its time
  if (run.eventList.find((e) => e.eventId === "rsg.enter_end")) {
    split = "END ENTER";
    const event = run.eventList.find((e) => e.eventId === "rsg.enter_end");
    time = event.igt;
  } else if (run.eventList.find((e) => e.eventId === "rsg.enter_stronghold")) {
    split = "STRONGHOLD";
    const event = run.eventList.find(
      (e) => e.eventId === "rsg.enter_stronghold"
    );
    time = event.igt;
  } else if (run.eventList.find((e) => e.eventId === "rsg.first_portal")) {
    split = "BLIND";
    const event = run.eventList.find((e) => e.eventId === "rsg.first_portal");
    time = event.igt;
  } else if (
    run.eventList.find((e) => e.eventId === "rsg.enter_fortress") &&
    run.eventList.find((e) => e.eventId === "rsg.enter_bastion")
  ) {
    split = "S2";
    const fortressEvent = run.eventList.find(
      (e) => e.eventId === "rsg.enter_fortress"
    );
    const bastionEvent = run.eventList.find(
      (e) => e.eventId === "rsg.enter_bastion"
    );

    // Use the later of the two events
    if (fortressEvent.igt > bastionEvent.igt) {
      time = fortressEvent.igt;
    } else {
      time = bastionEvent.igt;
    }
  } else if (
    run.eventList.find(
      (e) =>
        e.eventId === "rsg.enter_fortress" || e.eventId === "rsg.enter_bastion"
    )
  ) {
    split = "S1";
    const event = run.eventList.find(
      (e) =>
        e.eventId === "rsg.enter_fortress" || e.eventId === "rsg.enter_bastion"
    );
    time = event.igt;
  } else if (run.eventList.find((e) => e.eventId === "rsg.enter_nether")) {
    split = "NETHER";
    const event = run.eventList.find((e) => e.eventId === "rsg.enter_nether");
    time = event.igt;
  }

  // Calculate how long the runner has been in this split
  if (run.lastUpdated) {
    // If the split is the same as before, calculate duration based on lastUpdated
    if (previousRunData && previousRunData.split === split) {
      // Calculate time since the last update
      const timeSinceLastUpdate = (currentTimestamp - run.lastUpdated) / 1000; // Convert to seconds

      // Add the previous duration plus the time since the last update
      splitDuration = previousRunData.splitDuration + timeSinceLastUpdate;
    } else {
      // If the split has changed or there's no previous data,
      // assume the runner just entered this split
      splitDuration = (currentTimestamp - run.lastUpdated) / 1000; // Convert to seconds
    }
  } else if (previousRunData && previousRunData.split === split) {
    // If we don't have lastUpdated but we have previous data with the same split,
    // increment the previous duration by the polling interval
    splitDuration = previousRunData.splitDuration + 10; // Add 10 seconds (polling interval)
  }

  return {
    liveAccount,
    name,
    minecraftName,
    split,
    time: time ? time / 1000 : null,
    splitDuration,
    pb: previousRunData ? previousRunData.pb : null, // Preserve PB if available
  };
};
