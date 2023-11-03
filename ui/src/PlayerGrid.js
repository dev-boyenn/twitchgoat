import "./App.css";
import { TwitchPlayer } from "react-twitch-embed";
import { useState, useEffect, useCallback } from "react";
import { IconButton, Box } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
function PlayerGrid({
  collection,
  onSetChatChannel,
  hiddenChannels,
  onToggleHideChannel,
  settings,
  setFocussedChannels,
  focussedChannels,
}) {
  console.log(collection);

  const handleKeyPress = useCallback(
    (event) => {
      if (event.code === "KeyF") {
        if (document.querySelectorAll(".twitch-player :hover").length == 0)
          return;
        const channel = document
          .querySelectorAll(".twitch-player :hover")
          .item(0).id;
        if (event.shiftKey) {
          setFocussedChannels([channel]);
          return;
        }
        if (focussedChannels.indexOf(channel) > -1) {
          setFocussedChannels(focussedChannels.filter((c) => c !== channel));
          return;
        }

        setFocussedChannels([...focussedChannels, channel]);
      }
    },
    [focussedChannels, setFocussedChannels]
  );

  useEffect(() => {
    // attach the event listener
    document.addEventListener("keydown", handleKeyPress);

    // remove the event listener
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  const channels = collection.liveChannels.filter(
    (ch) => hiddenChannels.indexOf(ch) === -1
  );

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
          {focussedChannels.map((channel) => (
            <div
              style={{ width: "100%", height: "100%" }}
              id={"div-" + channel}
              class="twitch-player"
            >
              {/* <div> */}
              <IconButton
                style={{
                  position: "absolute",
                }}
                aria-label="delete"
                onClick={() => {
                  onSetChatChannel(channel);
                }}
              >
                <ChatIcon />
              </IconButton>
              {/* </div> */}

              <TwitchPlayer
                playsInline
                allowFullscreen
                channel={channel}
                id={channel}
                width={"100%"}
                height={"100%"}
                autoplay
                muted={!settings.unmuteFocussedChannels}
              />
            </div>
          ))}
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
          .filter((channel) => focussedChannels.indexOf(channel) === -1)
          .map((channel) => (
            <div
              style={{ width: "100%", height: "100%" }}
              id={"div-" + channel}
              class="twitch-player"
            >
              {/* <div> */}
              <IconButton
                style={{
                  position: "absolute",
                }}
                aria-label="delete"
                onClick={() => {
                  onSetChatChannel(channel);
                }}
              >
                <ChatIcon />
              </IconButton>
              {/* </div> */}

              <TwitchPlayer
                // playsInline={true}
                playsInline
                allowFullscreen
                channel={channel}
                id={channel}
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
