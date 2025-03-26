import React, { useEffect, useCallback } from "react";
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

  let numColumns;
  let numRows;
  if (focussedChannels.length > 0) {
    numColumns = channels.length - focussedChannels.length;
    numRows = 1;
  } else {
    numColumns = Math.ceil(Math.sqrt(channels.length));
    numRows = Math.ceil(channels.length / numColumns);
  }
  console.log(numColumns, numRows);
  // Create the grid template columns and rows CSS properties
  const gridTemplateColumns = `repeat(${numColumns}, 1fr)`;
  const gridTemplateRows = `repeat(${numRows}, 1fr)`;
  const focussedChannelsColumns = `repeat(${focussedChannels.length}, 1fr)`;

  return (
    <Box sx={{ flexGrow: 1 }}>
      {focussedChannels.length > 0 && (
        <div
          style={{
            display: "grid",
            backgroundColor: "black",
            height: "80vh",
            margin: 0,
            padding: 0,
            gridTemplateColumns: focussedChannelsColumns,
            gridTemplateRows: `repeat(1, 1fr)`,
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
                    top: "10px",
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
      <div
        style={{
          display: "grid",
          backgroundColor: "black",
          height: focussedChannels.length > 0 ? "20vh" : "100vh",
          margin: 0,
          padding: 0,
          gridTemplateColumns,
          gridTemplateRows,
        }}
      >
        {channels
          .filter(
            (channelData) =>
              focussedChannels.indexOf(channelData.liveAccount) === -1
          )
          .map((channelData, index) => (
            <div
              style={{ width: "100%", height: "100%", position: "relative" }}
              className="twitch-player"
              key={channelData.liveAccount + index}
            >
              {/* Chat Icon - Only visible on hover with recent movement */}
              <div
                style={{
                  position: "absolute",
                  top: "10px",
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
    </Box>
  );
}

export default PlayerGrid;
