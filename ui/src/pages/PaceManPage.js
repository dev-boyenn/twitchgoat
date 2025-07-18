import React, { useState, useCallback } from "react";
import "../App.css";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import MenuIcon from "@mui/icons-material/Menu";
import TabPanel from "@mui/lab/TabPanel";
import Drawer from "@mui/material/Drawer";
import { TwitchChat } from "react-twitch-embed";
import { IconButton, Typography, Paper } from "@mui/material";

// Custom components
import PlayerGrid from "../components/PlayerGrid";
import SettingsPanel from "../components/SettingsPanel";

// Custom hooks
import usePacemanData from "../services/usePacemanData";
import useSettings from "../services/useSettings";

/**
 * PaceManPage component - Main page for the PaceMan application
 * @returns {JSX.Element} The PaceMan page component
 */
function PaceManPage() {
  const [value, setValue] = useState("2");
  const [chatChannel, setChatChannel] = useState(null);
  const [open, setOpen] = useState(false);
  const { settings, setSettings } = useSettings();
  const {
    liveChannels,
    allLiveChannels,
    hiddenChannels,
    focussedChannels,
    setFocussedChannels,
    onToggleHideChannel,
  } = usePacemanData(settings);

  // Check if we're in event mode
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event");
  const isEventMode = !!eventId;

  const setChatChannelMemo = useCallback((channel) => {
    setChatChannel(channel);
    // setOpen(true);
    onTabChange(null, "2");
  }, []);

  const onTabChange = useCallback((event, newValue) => setValue(newValue), []);

  // Effect to switch chat channel when focused channels change
  React.useEffect(() => {
    if (!!settings.switchChatOnFocus && focussedChannels.length > 0) {
      setChatChannel(focussedChannels[0]);
    }
  }, [focussedChannels, settings.switchChatOnFocus]);

  const drawerWidth = 400;
  return (
    <>
      <IconButton
        sx={{
          position: "fixed",
          zIndex: 1000000,
          top: "5px",
          right: "10px",
        }}
        onClick={() => setOpen(!open)}
      >
        <MenuIcon />
      </IconButton>
      <Box sx={{ display: "flex", width: "100%" }}>
        <PlayerGrid
          style={{ width: "100%", flexGrow: 1 }}
          liveChannels={liveChannels}
          onSetChatChannel={setChatChannelMemo}
          hiddenChannels={hiddenChannels}
          onToggleHideChannel={onToggleHideChannel}
          setFocussedChannels={setFocussedChannels}
          focussedChannels={focussedChannels}
          settings={settings}
          setSettings={setSettings}
        />
        <Drawer
          sx={{
            width: open ? drawerWidth + "px" : "0px",
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth + "px",
            },
          }}
          variant="persistent"
          anchor="right"
          open={open}
        >
          <TabContext value={value}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <TabList onChange={onTabChange} aria-label="lab API tabs example">
                <Tab label="Chat" value="2" />
                <Tab label="Settings" value="3" />
              </TabList>
            </Box>

            <TabPanel
              value="2"
              sx={{ padding: 0, height: "100%", overflow: "hidden" }}
            >
              <TwitchChat
                width="100%"
                height="100%"
                channel={chatChannel}
                darkMode
              />
            </TabPanel>
            <TabPanel value="3">
              <SettingsPanel
                settings={settings}
                setSettings={setSettings}
                liveChannels={allLiveChannels}
              />
            </TabPanel>
          </TabContext>
        </Drawer>
      </Box>
    </>
  );
}

export default PaceManPage;
