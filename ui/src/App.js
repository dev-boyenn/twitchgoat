import "./App.css";
import CollectionEditor from "./CollectionEditor";
import PlayerGrid from "./PlayerGrid";
import { useEffect, useState, useCallback } from "react";
import * as React from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import Grid from "@mui/material/Grid";
import MenuIcon from "@mui/icons-material/Menu";
import TabPanel from "@mui/lab/TabPanel";
import Drawer from "@mui/material/Drawer";
import { TwitchChat } from "react-twitch-embed";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Button, Checkbox, IconButton } from "@mui/material";
function App() {
  // Get Collection UUID from the url

  const darkTheme = createTheme({
    palette: {
      mode: "dark",
    },
  });

  const url = new URL(window.location.href);
  const [collectionUUID, setCollectionUUID] = useState(
    url.searchParams.get("collection")
  );
  const [collection, setCollection] = useState(null);
  const [value, setValue] = React.useState("1");
  const [isUpdatingCollection, setIsUpdatingCollection] = useState(false);
  const [chatChannel, setChatChannel] = useState(null);
  const [hiddenChannels, setHiddenChannels] = useState(
    JSON.parse(window.localStorage.getItem("hiddenChannels")) || []
  );

  const [focussedChanels, setFocussedChannels] = useState([]);

  const onToggleHideChannel = useCallback((channel) => {
    alert(hiddenChannels);
    if (hiddenChannels.indexOf(channel) == -1) {
      setHiddenChannels([...hiddenChannels, channel]);
    } else {
      setHiddenChannels(hiddenChannels.filter((c) => c !== channel));
    }
  });

  useEffect(() => {
    window.localStorage.setItem(
      "hiddenChannels",
      JSON.stringify(hiddenChannels)
    );
  }, [hiddenChannels]);

  const setChatChannelMemo = useCallback((channel) => {
    setChatChannel(channel);
    setOpen(true);
    onTabChange(null, "2");
  });

  const onTabChange = useCallback((event, newValue) => setValue(newValue), []);

  useEffect(() => {
    function getCollection() {
      if (isUpdatingCollection) {
        setIsUpdatingCollection(false);
        return;
      }
      fetch(`https://twitchgoat.vercel.app/collections/${collectionUUID}`)
        .then((res) => res.json())
        .then((data) => {
          if (isUpdatingCollection) {
            setIsUpdatingCollection(false);
            return;
          }
          setCollection(data);
        });
    }
    getCollection();
    const interval = setInterval(() => getCollection(), 10000);
    return () => {
      clearInterval(interval);
    };
  }, [collectionUUID]);

  const [open, setOpen] = useState(true);
  const [settings, setSettings] = useState(
    JSON.parse(window.localStorage.getItem("settings")) || {}
  );

  useEffect(() => {
    console.log(settings);
    window.localStorage.setItem("settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!!settings.switchChatOnFocus && focussedChanels.length > 0) {
      setChatChannel(focussedChanels[0]);
    }
  }, [focussedChanels, settings.switchChatOnFocus]);
  // let collection = url.searchParams.get("collection");
  if (!collectionUUID) {
    return (
      <>
        No collection specified{" "}
        <button
          onClick={() => {
            fetch("https://twitchgoat.vercel.app/collections", {
              method: "POST",
              body: JSON.stringify({}),
            })
              .then((res) => res.text())
              .then((data) => {
                // set search params
                url.searchParams.set("collection", data);
                window.history.replaceState({}, "", url);
                setCollectionUUID(data);
              });
          }}
        >
          Create new collection
        </button>{" "}
      </>
    );
  }

  if (!collection) {
    return <>Loading...</>;
  }

  const drawerWidth = 400;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {/* <Grid container spacing={0}> */}
      {/* <Grid item xs={9}> */}
      <IconButton
        sx={{
          position: "fixed",
          zIndex: 1000000,
          top: "5px",
          right: "10px",
        }}
      >
        <MenuIcon onClick={() => setOpen(!open)}></MenuIcon>
      </IconButton>
      <Box sx={{ display: "flex", width: "100%" }}>
        <PlayerGrid
          style={{ width: "100%", flexGrow: 1 }}
          collection={collection}
          onSetChatChannel={setChatChannelMemo}
          hiddenChannels={hiddenChannels}
          onToggleHideChannel={onToggleHideChannel}
          setFocussedChannels={setFocussedChannels}
          focussedChannels={focussedChanels}
          settings={settings}
        />

        {/* </Grid> */}
        {/* <Grid item xs={3}> */}
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
                <Tab label="Collection" value="1" />
                <Tab label="Chat" value="2" />
                <Tab label="Settings" value="3" />
              </TabList>
            </Box>
            <TabPanel value="1" sx={{ overflow: "initial" }}>
              <Box sx={{ width: "100%", margin: 0 }}>
                <CollectionEditor
                  hiddenChannels={hiddenChannels}
                  onToggleHideChannel={onToggleHideChannel}
                  collection={collection}
                  style={{ margin: 0, padding: 0, width: "100%" }}
                  onUpdateCollection={(collection) => {
                    fetch(
                      `https://twitchgoat.vercel.app/collections/${collectionUUID}`,
                      {
                        method: "PUT",
                        body: JSON.stringify(collection),
                        headers: {
                          "Content-Type": "application/json",
                        },
                      }
                    ).then((res) => console.log(res));
                    setCollection({ ...collection });
                    setIsUpdatingCollection(true);
                  }}
                />
              </Box>
            </TabPanel>
            <TabPanel
              value="2"
              sx={{ padding: 0, height: "100%", overflow: "hidden" }}
            >
              <TwitchChat
                width="100%"
                height={"100%"}
                channel={chatChannel}
                darkMode
              />
            </TabPanel>
            <TabPanel value="3">
              <Box sx={{ width: "100%", margin: 0 }}>
                <Box>
                  <Checkbox
                    onChange={(e, v) =>
                      setSettings({
                        ...settings,
                        unmuteFocussedChannels: v,
                      })
                    }
                    checked={settings.unmuteFocussedChannels}
                  ></Checkbox>
                  Unmute focussed channels
                </Box>
                <Box>
                  <Checkbox
                    onChange={(e, v) =>
                      setSettings({
                        ...settings,
                        switchChatOnFocus: v,
                      })
                    }
                    checked={settings.switchChatOnFocus}
                  ></Checkbox>
                  Switch Chat to first focussed channel
                </Box>
              </Box>
            </TabPanel>
          </TabContext>
        </Drawer>
      </Box>
      {/* </Grid> */}
      {/* </Grid> */}
    </ThemeProvider>
  );
}

export default App;
