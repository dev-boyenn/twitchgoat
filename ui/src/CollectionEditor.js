import logo from "./logo.svg";
import "./App.css";
import { TwitchPlayer } from "react-twitch-embed";
import { useEffect, useRef, useState } from "react";
import { TwitchChat } from "react-twitch-embed";
import { Box, Button, IconButton, Input, List, ListItem } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
function CollectionEditor({ collection, onUpdateCollection }) {
  const [newChannelName, setNewChannelName] = useState("");

  const onRemoveChannel = (channel) => {
    collection.channels = collection.channels.filter((c) => c != channel);
    collection.liveChannels = collection.liveChannels.filter(
      (c) => c != channel
    );
    collection.hiddenChannels = collection.hiddenChannels.filter(
      (c) => c != channel
    );
    onUpdateCollection(collection);
  };

  const onToggleHideChannel = (channel) => {
    if(collection.hiddenChannels.indexOf(channel) == -1) {
      collection.hiddenChannels.push(channel);
    }else{
      collection.hiddenChannels = collection.hiddenChannels.filter(
        (c) => c != channel
      );
    }
    onUpdateCollection(collection);
  };
  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        New Channel
        <Box>
          <Input
            type="text"
            value={newChannelName}
            onChange={(e) => {
              setNewChannelName(e.target.value);
            }}
          />
          <Button
            onClick={() => {
              collection.channels.push(newChannelName);
              setNewChannelName("");
              onUpdateCollection(collection);
            }}
          >
            add
          </Button>
        </Box>
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        Live
        <List dense>
          {collection.liveChannels.map((channel) => (
            <ListItem>
              {channel}{" "}
              <IconButton onClick={() => onRemoveChannel(channel)}>
                <DeleteIcon />
              </IconButton>
              <IconButton onClick={() => onToggleHideChannel(channel)}>
                  {collection.hiddenChannels.indexOf(channel) > -1  && <VisibilityIcon />}
                  {collection.hiddenChannels.indexOf(channel) == -1  && <VisibilityOffIcon />}
                </IconButton>
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        Not Live
        <List dense>
          {collection.channels
            .filter((channel) => collection.liveChannels.indexOf(channel) == -1)
            .map((channel) => (
              <ListItem>
                {channel}{" "}
                <IconButton onClick={() => onRemoveChannel(channel)}>
                  <DeleteIcon />
                </IconButton>
                <IconButton onClick={() => onToggleHideChannel(channel)}>
                  {collection.hiddenChannels.indexOf(channel) > -1  && <VisibilityIcon />}
                  {collection.hiddenChannels.indexOf(channel) == -1  && <VisibilityOffIcon />}
                </IconButton>
              </ListItem>
            ))}
        </List>
      </Box>
    </Box>
  );
}

export default CollectionEditor;
