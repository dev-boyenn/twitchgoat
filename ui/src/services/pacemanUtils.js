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

/**
 * Calculates the adjusted time for a split
 * @param {string} split - The split name
 * @param {number} time - The time in seconds
 * @returns {number} The adjusted time value
 */
export const getAdjustedTime = (split, time) => {
  if (!split || !time) return Infinity;

  // Calculate how close the time is to the good split time
  const timeFactor = time / goodsplits[split];
  // Subtract the progression bonus to reward further stages
  return timeFactor - progressionBonus[split];
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
    pb: null, // Will be populated later
  };
};
