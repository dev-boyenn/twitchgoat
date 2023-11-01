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
import TabPanel from "@mui/lab/TabPanel";
import { TwitchChat } from "react-twitch-embed";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
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

  const [chatChannel, setChatChannel] = useState(null);
  const setChatChannelMemo = useCallback((channel) => {
    setValue("2");
    setChatChannel(channel);
  });

  const onTabChange = useCallback((event, newValue) => setValue(newValue), []);

  useEffect(() => {
    if (collectionUUID) {
      fetch(`https://twitchgoat.vercel.app/collections/${collectionUUID}`)
        .then((res) => res.json())
        .then((data) => {
          setCollection(data);
          setChatChannel(data.liveChannels[0]);
        });
    }
  }, [collectionUUID]);
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

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Grid container spacing={0}>
        <Grid item xs={9}>
          <PlayerGrid
            collection={collection}
            onSetChatChannel={setChatChannelMemo}
          />
        </Grid>
        <Grid item xs={3}>
          <TabContext value={value}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <TabList onChange={onTabChange} aria-label="lab API tabs example">
                <Tab label="Collection" value="1" />
                <Tab label="Chat" value="2" />
              </TabList>
            </Box>
            <TabPanel value="1" sx={{}}>
              <Box sx={{ width: "100%", margin: 0 }}>
                <CollectionEditor
                  collection={collection}
                  style={{ margin: 0, padding: 0, width: "100%" }}
                  onUpdateCollection={(collection) => {
                    fetch(
                      `https://twitchgoat.vercel.app/collections/${collectionUUID}`,
                      {
                        mode: 'no-cors',
                        method: "PUT",
                        body: JSON.stringify(collection),
                        headers: {
                          "Content-Type": "application/json",
                        },
                      }
                    ).then((res) => console.log(res));
                    setCollection({ ...collection });
                  }}
                />
              </Box>
            </TabPanel>
            <TabPanel value="2" sx={{ padding: 0, height: "100%" }}>
              <TwitchChat
                width="100%"
                height={"100%"}
                channel={chatChannel}
                darkMode
              />
            </TabPanel>
          </TabContext>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

export default App;
