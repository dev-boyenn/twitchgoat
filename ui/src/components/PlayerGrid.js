import React, { useState, useEffect, useCallback } from "react";
import "./PlayerGrid.css";
import { TwitchPlayer } from "react-twitch-embed";
import { IconButton, Box } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import PaceOverlay from "./PaceOverlay";

/**
 * PlayerGrid component for displaying Twitch streams
 * @param {Object} props - Component props
 * @param {Array} props.liveChannels - List of live channels
 * @param {Function} props.onSetChatChannel - Function to set the chat channel
 * @param {Array} props.hiddenChannels - List of hidden channels
 * @param {Function} props.onToggleHideChannel - Function to toggle hiding a channel
 * @param {Object} props.settings - User settings
 * @param {Function} props.setFocussedChannels - Function to set focused channels
 * @param {Array} props.focussedChannels - List of focused channels
 * @returns {JSX.Element} The player grid component
 */
function PlayerGrid({
  liveChannels,
  onSetChatChannel,
  hiddenChannels,
  onToggleHideChannel,
  settings,
  setFocussedChannels,
  focussedChannels,
}) {
  // Filter out hidden channels
  const channels = liveChannels.filter(
    (ch) => hiddenChannels.indexOf(ch.liveAccount) === -1
  );

  const handleKeyPress = useCallback(
    (event) => {
      if (event.code === "KeyF") {
        if (document.querySelectorAll(".twitch-player:hover").length == 0)
          return;

        // Get the ID from the hovered element
        const hoveredId = document
          .querySelectorAll(".twitch-player:hover")
          .item(0).id;

        // Extract the index from the ID (format is "focussed0" or "unfocussed0")
        const isFocussed = hoveredId.startsWith("focussed");
        const index = parseInt(hoveredId.replace(/^(focussed|unfocussed)/, ""));

        // Get the channel data based on whether it's in the focused or unfocused section
        let channelName;
        if (isFocussed) {
          channelName = focussedChannels[index];
        } else {
          const unfocusedChannels = channels.filter(
            (ch) => focussedChannels.indexOf(ch.liveAccount) === -1
          );
          channelName = unfocusedChannels[index]?.liveAccount;
        }

        if (!channelName) return;

        if (event.shiftKey) {
          setFocussedChannels([channelName]);
          return;
        }

        if (focussedChannels.indexOf(channelName) > -1) {
          setFocussedChannels(
            focussedChannels.filter((c) => c !== channelName)
          );
          return;
        }

        setFocussedChannels([...focussedChannels, channelName]);
      }
    },
    [focussedChannels, setFocussedChannels, channels]
  );

  useEffect(() => {
    // attach the event listener
    document.addEventListener("keydown", handleKeyPress);

    // remove the event listener
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  // Calculate the number of unfocused channels
  const unfocusedChannels = channels.filter(
    (ch) => focussedChannels.indexOf(ch.liveAccount) === -1
  );

  // State to store window dimensions
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 720,
  });

  // Update window dimensions when window size changes
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Add event listener for window resize
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);

      // Initial calculation
      handleResize();

      // Cleanup
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  // Calculate optimal grid layout for unfocused channels
  // The goal is to maintain 16:9 aspect ratio for each stream container
  const calculateOptimalGrid = (
    numChannels,
    containerWidth,
    containerHeight
  ) => {
    if (numChannels <= 0) return { columns: 1, rows: 1 };
    if (numChannels === 1) return { columns: 1, rows: 1 };
    if (numChannels === 2) return { columns: 2, rows: 1 };

    // Calculate container aspect ratio
    const containerAspectRatio = containerWidth / containerHeight;

    // Target aspect ratio for each cell is 16:9
    const targetCellAspectRatio = 16 / 9;

    // Calculate the ideal number of columns based on the container aspect ratio
    // and the target cell aspect ratio
    let bestColumns = 1;
    let bestRows = numChannels;
    let bestScore = Number.MAX_VALUE;

    // Try different column counts to find the optimal layout
    for (let cols = 1; cols <= numChannels; cols++) {
      const rows = Math.ceil(numChannels / cols);

      // Calculate the cell dimensions
      const cellWidth = containerWidth / cols;
      const cellHeight = containerHeight / rows;
      const cellAspectRatio = cellWidth / cellHeight;

      // Calculate how far this layout is from the ideal 16:9 aspect ratio
      const score = Math.abs(cellAspectRatio - targetCellAspectRatio);

      // If this layout is better than the previous best, update the best layout
      if (score < bestScore) {
        bestScore = score;
        bestColumns = cols;
        bestRows = rows;
      }
    }

    return { columns: bestColumns, rows: bestRows };
  };

  // Calculate dynamic height distribution based on number of channels
  // The goal is to maintain 16:9 aspect ratio for each stream container
  const calculateHeightDistribution = () => {
    if (focussedChannels.length === 0 || unfocusedChannels.length === 0) {
      return { focusedHeight: "100vh", unfocusedHeight: "0vh" };
    }

    // Calculate the total available height
    const totalHeight = windowDimensions.height;
    const totalWidth = windowDimensions.width;

    // Calculate the optimal grid layout for unfocused channels
    const unfocusedGrid = calculateOptimalGrid(
      unfocusedChannels.length,
      totalWidth,
      totalHeight / 2 // Start with a 50/50 split as a baseline
    );

    // Calculate the optimal grid layout for focused channels
    const focusedGrid = calculateOptimalGrid(
      focussedChannels.length,
      totalWidth,
      totalHeight / 2 // Start with a 50/50 split as a baseline
    );

    // Calculate the ideal height for each section based on the grid layout
    // and the 16:9 aspect ratio
    const idealUnfocusedCellWidth = totalWidth / unfocusedGrid.columns;
    const idealUnfocusedCellHeight = idealUnfocusedCellWidth * (9 / 16);
    const idealUnfocusedHeight = idealUnfocusedCellHeight * unfocusedGrid.rows;

    const idealFocusedCellWidth = totalWidth / focusedGrid.columns;
    const idealFocusedCellHeight = idealFocusedCellWidth * (9 / 16);
    const idealFocusedHeight = idealFocusedCellHeight * focusedGrid.rows;

    // Calculate the ratio of focused to unfocused height
    const totalIdealHeight = idealFocusedHeight + idealUnfocusedHeight;
    const focusedRatio = Math.min(
      0.8,
      Math.max(0.4, idealFocusedHeight / totalIdealHeight)
    );
    const unfocusedRatio = 1 - focusedRatio;

    // Convert to vh units
    const focusedHeight = `${Math.round(focusedRatio * 100)}vh`;
    const unfocusedHeight = `${Math.round(unfocusedRatio * 100)}vh`;

    return { focusedHeight, unfocusedHeight };
  };

  // Calculate the height distribution
  const { focusedHeight, unfocusedHeight } = calculateHeightDistribution();

  // Calculate the grid layout for focused and unfocused channels
  const focusedGrid = calculateOptimalGrid(
    focussedChannels.length,
    windowDimensions.width,
    windowDimensions.height * (parseInt(focusedHeight) / 100)
  );

  const unfocusedGrid = calculateOptimalGrid(
    unfocusedChannels.length,
    windowDimensions.width,
    windowDimensions.height * (parseInt(unfocusedHeight) / 100)
  );

  // Create the grid template columns and rows CSS properties
  const focusedGridTemplateColumns = `repeat(${focusedGrid.columns}, 1fr)`;
  const focusedGridTemplateRows = `repeat(${focusedGrid.rows}, 1fr)`;

  const unfocusedGridTemplateColumns = `repeat(${unfocusedGrid.columns}, 1fr)`;
  const unfocusedGridTemplateRows = `repeat(${unfocusedGrid.rows}, 1fr)`;

  return (
    <Box sx={{ flexGrow: 1 }}>
      {focussedChannels.length > 0 && (
        <div
          style={{
            display: "grid",
            backgroundColor: "black",
            height: focusedHeight,
            margin: 0,
            padding: 0,
            gridTemplateColumns: focusedGridTemplateColumns,
            gridTemplateRows: focusedGridTemplateRows,
            gap: "2px", // Add a small gap between grid items
          }}
        >
          {focussedChannels.map((channelName, index) => {
            // Find the channel data in the liveChannels array
            const channelData = liveChannels.find(
              (ch) => ch.liveAccount === channelName
            );
            if (!channelData) return null;

            return (
              <div
                style={{ width: "100%", height: "100%", position: "relative" }}
                className="twitch-player"
                key={channelData.liveAccount + index}
              >
                {/* Chat Icon - Only visible on hover with recent movement */}
                <div
                  style={{
                    position: "absolute",
                    top: "50px",
                    right: "10px",
                    zIndex: 1001,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  className="chat-icon-container"
                >
                  <IconButton
                    size="small"
                    sx={{
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                      },
                    }}
                    aria-label="chat"
                    onClick={() => {
                      onSetChatChannel(channelData.liveAccount);
                    }}
                  >
                    <ChatIcon fontSize="small" />
                  </IconButton>
                </div>

                {/* Pace Overlay */}
                <PaceOverlay
                  split={channelData.split}
                  time={channelData.time}
                  name={channelData.minecraftName || channelData.name}
                  pb={channelData.pb}
                  debugInfo={channelData.debugInfo}
                  settings={settings}
                  skinUrl={channelData.skinUrl}
                />

                <TwitchPlayer
                  playsInline
                  allowFullscreen
                  channel={channelData.liveAccount}
                  id={"focussed" + index.toString()}
                  width={"100%"}
                  height={"100%"}
                  autoplay
                  muted={!settings.unmuteFocussedChannels}
                />
              </div>
            );
          })}
        </div>
      )}
      {unfocusedChannels.length > 0 && (
        <div
          style={{
            display: "grid",
            backgroundColor: "black",
            height: focussedChannels.length > 0 ? unfocusedHeight : "100vh",
            margin: 0,
            padding: 0,
            gridTemplateColumns: unfocusedGridTemplateColumns,
            gridTemplateRows: unfocusedGridTemplateRows,
            gap: "2px", // Add a small gap between grid items
          }}
        >
          {unfocusedChannels.map((channelData, index) => (
            <div
              style={{ width: "100%", height: "100%", position: "relative" }}
              className="twitch-player"
              key={channelData.liveAccount + index}
            >
              {/* Chat Icon - Only visible on hover with recent movement */}
              <div
                style={{
                  position: "absolute",
                  top: "50px",
                  right: "10px",
                  zIndex: 1001,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                className="chat-icon-container"
              >
                <IconButton
                  size="small"
                  sx={{
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                    },
                  }}
                  aria-label="chat"
                  onClick={() => {
                    onSetChatChannel(channelData.liveAccount);
                  }}
                >
                  <ChatIcon fontSize="small" />
                </IconButton>
              </div>

              {/* Pace Overlay */}
              <PaceOverlay
                split={channelData.split}
                time={channelData.time}
                name={channelData.minecraftName || channelData.name}
                pb={channelData.pb}
                debugInfo={channelData.debugInfo}
                settings={settings}
                skinUrl={channelData.skinUrl}
              />

              <TwitchPlayer
                playsInline
                allowFullscreen
                channel={channelData.liveAccount}
                id={"unfocussed" + index.toString()}
                width={"100%"}
                height={"100%"}
                autoplay
                muted
              />
            </div>
          ))}
        </div>
      )}
    </Box>
  );
}

export default PlayerGrid;
