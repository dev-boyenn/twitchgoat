import "./App.css";
import { TwitchPlayer, TwitchPlayerNonInteractive } from "react-twitch-embed";
import { useState, useEffect, useCallback } from "react";
import { IconButton, Box, Typography } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";

// Split icons mapping - using Minecraft-themed icons from paceman.gg
const splitIcons = {
  NETHER: "https://paceman.gg/stats/nether.webp", // Nether icon
  S1: "https://paceman.gg/stats/bastion.webp", // Bastion icon (Structure 1)
  S2: "https://paceman.gg/stats/fortress.webp", // Fortress icon (Structure 2)
  BLIND: "https://paceman.gg/stats/first_portal.webp", // First Portal icon (Blind)
  STRONGHOLD: "https://paceman.gg/stats/stronghold.webp", // Stronghold icon
  "END ENTER": "https://paceman.gg/stats/end.webp", // End icon
  FINISH: "https://paceman.gg/stats/finish.webp", // Finish icon
};

// Fallback to text labels if images don't load
const splitLabels = {
  NETHER: "Nether",
  S1: "S1",
  S2: "S2",
  BLIND: "Blind",
  STRONGHOLD: "SH",
  "END ENTER": "End",
};

// Format time in minutes:seconds
const formatTime = (seconds) => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Pace overlay component
const PaceOverlay = ({ split, time, name, pb }) => {
  // Use state to track if image failed to load
  const [imageError, setImageError] = useState(false);

  if (!split || !time) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        top: "10px",
        left: "10px",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "5px 10px",
        borderRadius: "4px",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
        }}
      >
        {splitIcons[split] && !imageError ? (
          <img
            src={splitIcons[split]}
            alt={split}
            style={{ width: "24px", height: "24px" }}
            onError={() => setImageError(true)}
          />
        ) : (
          <span
            style={{
              fontWeight: "bold",
              color:
                split === "NETHER"
                  ? "#9b59b6"
                  : split === "S1"
                  ? "#f1c40f"
                  : split === "S2"
                  ? "#34495e"
                  : split === "BLIND"
                  ? "#2ecc71"
                  : split === "STRONGHOLD"
                  ? "#95a5a6"
                  : split === "END ENTER"
                  ? "#3498db"
                  : "white",
            }}
          >
            {splitLabels[split] || split}
          </span>
        )}
        <Typography variant="body2">{formatTime(time)}</Typography>
      </Box>
      {name && (
        <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
          {name} {pb ? `(PB: ${formatTime(pb)})` : ""}
        </Typography>
      )}
    </Box>
  );
};
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
                <IconButton
                  style={{
                    position: "absolute",
                    zIndex: 1001,
                  }}
                  aria-label="chat"
                  onClick={() => {
                    onSetChatChannel(channelData.liveAccount);
                  }}
                >
                  <ChatIcon />
                </IconButton>

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
              <IconButton
                style={{
                  position: "absolute",
                  zIndex: 1001,
                }}
                aria-label="chat"
                onClick={() => {
                  onSetChatChannel(channelData.liveAccount);
                }}
              >
                <ChatIcon />
              </IconButton>

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
  // <TwitchPlayer channel="potozal" autoplay muted onReady={handleReady} />
  // </>
}

export default PlayerGrid;
