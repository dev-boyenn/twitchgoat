/**
 * Service for interacting with the PaceMan API
 */

/**
 * Determines the API base URL based on the environment
 * @returns {string} The base URL for the API
 */
export const getApiBaseUrl = () => {
  // Check if we're running on Vercel (production)
  if (window.location.hostname === "twitchgoat.vercel.app") {
    return "https://twitchgoat-a5vk.vercel.app";
  }
  // Otherwise, we're running locally
  return "http://localhost:3001";
};

/**
 * Fetches PB time for a runner from our backend proxy
 * @param {string} username - The username to fetch PB for
 * @returns {Promise<number|null>} The PB time in seconds, or null if not found
 */
export const fetchPbTime = async (username) => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(
      `${apiBaseUrl}/paceman/pb?username=${username}`
    );
    if (!response.ok) {
      console.error(
        `Error fetching PB for ${username}: ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();

    // Check if there's an error in the response
    if (data.error) {
      console.error(`Error fetching PB for ${username}: ${data.error}`);
      return null;
    }

    // Return the pb value from the response
    return data.pb;
  } catch (error) {
    console.error(`Error fetching PB for ${username}:`, error);
    return null;
  }
};

/**
 * Fetches live runs from the PaceMan API
 * @returns {Promise<Array>} Array of live runs
 */
export const fetchLiveRuns = async () => {
  try {
    const res = await fetch("https://paceman.gg/api/ars/liveruns");
    return await res.json();
  } catch (error) {
    console.error("Error fetching live runs:", error);
    return [];
  }
};
