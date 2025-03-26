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

    // Return the worse (lower) score
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
 * Determines the current split and time from run data
 * @param {Object} run - The raw run data from the API
 * @returns {Object} Object containing split and time information
 */
export const determineCurrentSplit = (run) => {
  let split = null;
  let time = null;

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

  return {
    split,
    time: time ? time / 1000 : null,
  };
};

/**
 * Processes raw run data from the API into a structured format
 * @param {Object} run - The raw run data from the API
 * @param {Object} splitInfo - Information about the runner's current split
 * @returns {Object} Processed run data
 */
export const processRunData = (run, splitInfo = null) => {
  const liveAccount = run.user.liveAccount;
  const name = run.user.username || liveAccount; // Use username or fallback to liveAccount
  const minecraftName = run.nickname; // This is the Minecraft account name

  // Get split and time information
  const { split, time } = determineCurrentSplit(run);

  // Calculate split duration
  let splitDuration = 0;

  if (splitInfo) {
    if (splitInfo.split === split) {
      // Same split as before, calculate duration from when they entered the split
      splitDuration = (Date.now() - splitInfo.enteredSplitAt) / 1000;
    }
    // If split changed, splitDuration remains 0
  }

  return {
    liveAccount,
    name,
    minecraftName,
    split,
    time,
    splitDuration,
    pb: splitInfo ? splitInfo.pb : null, // Preserve PB if available
  };
};
