import logo from "./logo.svg";
import "./App.css";
import { TwitchPlayer } from "react-twitch-embed";
import { memo } from "react";
import { IconButton } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
function PlayerGrid({ collection, onSetChatChannel }) {
  console.log(collection);

  const channels = collection.liveChannels.filter(ch => collection.hiddenChannels.indexOf(ch) == -1);
  // const embed = useRef(); // We use a ref instead of state to avoid rerenders.

  // const handleReady = (e) => {
  //   embed.current = e;
  // };

  // Calculate the number of columns and rows based on the square root
  const numColumns = Math.floor(Math.sqrt(channels.length));
  const numRows = Math.ceil(channels.length / numColumns);
  console.log(numColumns, numRows);
  // Create the grid template columns and rows CSS properties
  const gridTemplateColumns = `repeat(${numColumns}, 1fr)`;
  const gridTemplateRows = `repeat(${numRows}, 1fr)`;

  return (
    <div
      style={{
        display: "grid",
        backgroundColor: "black",
        // width: "80vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        gridTemplateColumns,
        gridTemplateRows,
      }}
    >
      {channels.map((channel) => (
        <div style={{ width: "100%", height: "100%" }} id={"div-" + channel}>
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
  );
  // <TwitchPlayer channel="potozal" autoplay muted onReady={handleReady} />
  // </>
}

export default PlayerGrid;
