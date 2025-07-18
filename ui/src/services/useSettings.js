import { useState, useEffect } from "react";

/**
 * Default settings values
 */
const defaultSettings = {
  maxFocussedChannels: 1,
  totalChannels: 3,
  unmuteFocussedChannels: false,
  switchChatOnFocus: false,
  filteredRunners: "", // New setting for filtered runners
  showDebugInfo: false, // Setting to control debug information visibility
  hiddenStreams: [], // Array of stream names to hide in event mode
};

/**
 * Custom hook for managing user settings
 * @returns {Object} Settings and setter function
 */
export const useSettings = () => {
  // Initialize settings from localStorage or use defaults
  const [settings, setSettings] = useState(() => {
    const savedSettings = window.localStorage.getItem("settings");
    return savedSettings
      ? Object.assign({}, defaultSettings, JSON.parse(savedSettings))
      : defaultSettings;
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    window.localStorage.setItem("settings", JSON.stringify(settings));
  }, [settings]);

  return { settings, setSettings };
};

export default useSettings;
