import "./App.css";
import PlayerGrid from "./PlayerGrid";
import { useEffect, useState, useCallback } from "react";
import * as React from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import MenuIcon from "@mui/icons-material/Menu";
import TabPanel from "@mui/lab/TabPanel";
import Drawer from "@mui/material/Drawer";
import { TwitchChat } from "react-twitch-embed";
import { Checkbox, IconButton, Slider } from "@mui/material";
import Typography from "@mui/material/Typography";

const goodsplits = {
  NETHER: 90,
  S1: 120,
  S2: 240,
  BLIND: 300,
  STRONGHOLD: 400,
  "END ENTER": 420,
};

const progressionBonus = {
  NETHER: -0.1,
  S1: 0.1,
  S2: 0.7,
  BLIND: 0.8,
  STRONGHOLD: 0.85,
  "END ENTER": 0.9,
};

const getAdjustedTime = (split, time) => {
  // Calculate how close the time is to the good split time
  const timeFactor = time / goodsplits[split];
  // Subtract the progression bonus to reward further stages
  return timeFactor - progressionBonus[split];
};

function PaceManPage() {
  const [value, setValue] = React.useState("2");
  const [liveChannels, setLiveChannels] = useState([]);
  const [chatChannel, setChatChannel] = useState(null);
  const [hiddenChannels, setHiddenChannels] = useState(
    JSON.parse(window.localStorage.getItem("hiddenChannels")) || []
  );
  const [focussedChanels, setFocussedChannels] = useState([]);

  // Default settings values if they are not already set
  const defaultSettings = {
    maxFocussedChannels: 1,
    maxTotalChannels: 2,
    minTotalChannels: 2,
    unmuteFocussedChannels: false,
    switchChatOnFocus: false,
  };
  const [settings, setSettings] = useState(
    Object.assign(
      {},
      defaultSettings,
      JSON.parse(window.localStorage.getItem("settings")) || {}
    )
  );

  useEffect(() => {
    window.localStorage.setItem("settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    window.localStorage.setItem(
      "hiddenChannels",
      JSON.stringify(hiddenChannels)
    );
  }, [hiddenChannels]);

  const onToggleHideChannel = useCallback(
    (channelName) => {
      // Toggle channel hide state
      if (hiddenChannels.indexOf(channelName) === -1) {
        setHiddenChannels([...hiddenChannels, channelName]);
      } else {
        setHiddenChannels(hiddenChannels.filter((c) => c !== channelName));
      }
    },
    [hiddenChannels]
  );

  const setChatChannelMemo = useCallback((channel) => {
    setChatChannel(channel);
    setOpen(true);
    onTabChange(null, "2");
  }, []);

  const onTabChange = useCallback((event, newValue) => setValue(newValue), []);

  // Function to determine the API base URL based on the environment
  const getApiBaseUrl = () => {
    // Check if we're running on Vercel (production)
    if (window.location.hostname === "twitchgoat.vercel.app") {
      return "https://twitchgoat-a5vk.vercel.app";
    }
    // Otherwise, we're running locally
    return "http://localhost:3001";
  };

  // Function to fetch PB time for a runner from our backend proxy
  const fetchPbTime = async (username) => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(
        `${apiBaseUrl}/paceman/pb?username=${username}`
      );
      if (!response.ok) {
        console.error(
          `Error fetching PB for ${username}: ${response.statusText}`
        );
        return null;
      }

      const data = await response.json();

      // Check if there's an error in the response
      if (data.error) {
        console.error(`Error fetching PB for ${username}: ${data.error}`);
        return null;
      }

      // Return the pb value from the response
      return data.pb;
    } catch (error) {
      console.error(`Error fetching PB for ${username}:`, error);
      return null;
    }
  };

  useEffect(() => {
    async function getPaceChannels() {
      try {
        const res = await fetch("https://paceman.gg/api/ars/liveruns");
        const data = await res.json();

        const liveRuns = data.filter(
          (run) => run.user.liveAccount != null && run.isHidden === false
        );
        const hiddenRuns = data.filter(
          (run) => run.user.liveAccount != null && run.isHidden === true
        );

        // Map runs with basic info first
        const runsWithBasicInfo = liveRuns.map((run) => {
          const liveAccount = run.user.liveAccount;
          const name = run.user.username || liveAccount; // Use username or fallback to liveAccount
          const minecraftName = run.nickname; // This is the Minecraft account name
          let split = null;
          let time = null;

          if (run.eventList.find((e) => e.eventId === "rsg.enter_end")) {
            split = "END ENTER";
            time = run.eventList.find((e) => e.eventId === "rsg.enter_end").igt;
          } else if (
            run.eventList.find((e) => e.eventId === "rsg.enter_stronghold")
          ) {
            split = "STRONGHOLD";
            time = run.eventList.find(
              (e) => e.eventId === "rsg.enter_stronghold"
            ).igt;
          } else if (
            run.eventList.find((e) => e.eventId === "rsg.first_portal")
          ) {
            split = "BLIND";
            time = run.eventList.find(
              (e) => e.eventId === "rsg.first_portal"
            ).igt;
          } else if (
            run.eventList.find((e) => e.eventId === "rsg.enter_fortress") &&
            run.eventList.find((e) => e.eventId === "rsg.enter_bastion")
          ) {
            split = "S2";
            time = Math.max(
              run.eventList.find((e) => e.eventId === "rsg.enter_fortress").igt,
              run.eventList.find((e) => e.eventId === "rsg.enter_bastion").igt
            );
          } else if (
            run.eventList.find(
              (e) =>
                e.eventId === "rsg.enter_fortress" ||
                e.eventId === "rsg.enter_bastion"
            )
          ) {
            split = "S1";
            time = run.eventList.find(
              (e) =>
                e.eventId === "rsg.enter_fortress" ||
                e.eventId === "rsg.enter_bastion"
            ).igt;
          } else if (
            run.eventList.find((e) => e.eventId === "rsg.enter_nether")
          ) {
            split = "NETHER";
            time = run.eventList.find(
              (e) => e.eventId === "rsg.enter_nether"
            ).igt;
          }

          return {
            liveAccount,
            name,
            minecraftName,
            split,
            time: time / 1000,
            pb: null, // Will be populated later
          };
        });

        // Fetch PB times for each runner
        const pbPromises = runsWithBasicInfo.map(async (run) => {
          // Use Minecraft nickname if available, otherwise use Twitch name
          const nameForPb = run.minecraftName || run.name;
          console.log(`Fetching PB for ${nameForPb}...`);
          const pb = await fetchPbTime(nameForPb);
          console.log(`PB for ${nameForPb}: ${pb}`);
          return { ...run, pb };
        });

        // Wait for all PB fetches to complete
        const runsWithPb = await Promise.all(pbPromises);

        // Log the runs with PB times
        console.log("Runs with PB times:", runsWithPb);

        // Sort runs by adjusted time
        const orderedRuns = runsWithPb.sort((a, b) => {
          return (
            getAdjustedTime(a.split, a.time) - getAdjustedTime(b.split, b.time)
          );
        });

        // Use the minimum total channels setting (defaulting to 3)
        const minChannels = settings.minTotalChannels || 3;
        if (orderedRuns.length < minChannels) {
          liveChannels.forEach((channelData) => {
            if (
              !orderedRuns.find(
                (run) => run.liveAccount === channelData.liveAccount
              ) &&
              orderedRuns.length < minChannels
            ) {
              orderedRuns.push({
                liveAccount: channelData.liveAccount,
                name: channelData.name || channelData.liveAccount,
                split: channelData.split,
                time: channelData.time,
                pb: channelData.pb,
              });
            }
          });
        }

        // If its still less than the minimum channels, add some hidden runs
        if (orderedRuns.length < minChannels) {
          for (const run of hiddenRuns) {
            if (
              !orderedRuns.find((r) => r.liveAccount === run.user.liveAccount)
            ) {
              const name = run.user.username || run.user.liveAccount;
              const minecraftName = run.nickname; // This is the Minecraft account name
              const nameForPb = minecraftName || name;
              const pb = await fetchPbTime(nameForPb);

              orderedRuns.push({
                liveAccount: run.user.liveAccount,
                name,
                minecraftName,
                split: null,
                time: null,
                pb,
              });

              if (orderedRuns.length >= minChannels) break;
            }
          }
        }

        // Limit total channels based on setting (defaulting to 10)
        const maxTotal = settings.maxTotalChannels || 10;
        const limitedRuns = orderedRuns.slice(0, maxTotal);

        // Check if the liveChannels have changed by comparing liveAccount values, splits, or times
        const currentLiveAccounts = liveChannels.map((ch) => ch.liveAccount);
        const newLiveAccounts = limitedRuns.map((run) => run.liveAccount);

        // Check if the list of channels has changed
        let channelsChanged =
          currentLiveAccounts.length !== newLiveAccounts.length ||
          !currentLiveAccounts.every(
            (value, index) => value === newLiveAccounts[index]
          );

        // Also check if any split or time has changed for existing channels
        if (!channelsChanged) {
          for (let i = 0; i < limitedRuns.length; i++) {
            const newRun = limitedRuns[i];
            const existingRun = liveChannels.find(
              (ch) => ch.liveAccount === newRun.liveAccount
            );

            if (existingRun) {
              // Check if split or time has changed
              if (
                existingRun.split !== newRun.split ||
                existingRun.time !== newRun.time
              ) {
                console.log(
                  `Split or time changed for ${newRun.name}: ${existingRun.split}/${existingRun.time} -> ${newRun.split}/${newRun.time}`
                );
                channelsChanged = true;
                break;
              }
            }
          }
        }

        if (channelsChanged) {
          // Store the full run data including split and time information
          console.log("Setting live channels:", limitedRuns);
          setLiveChannels(limitedRuns);
          // Limit focussed channels based on setting (defaulting to 1)
          const maxFocussed = settings.maxFocussedChannels || 1;
          setFocussedChannels(
            limitedRuns.slice(0, maxFocussed).map((run) => run.liveAccount)
          );
        }
      } catch (error) {
        console.error("Error fetching pace channels:", error);
      }
    }
    getPaceChannels();
    const interval = setInterval(() => getPaceChannels(), 10000);
    return () => {
      clearInterval(interval);
    };
  }, [liveChannels, settings]);

  useEffect(() => {
    if (!!settings.switchChatOnFocus && focussedChanels.length > 0) {
      setChatChannel(focussedChanels[0]);
    }
  }, [focussedChanels, settings.switchChatOnFocus]);

  const [open, setOpen] = useState(true);
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
          focussedChannels={focussedChanels}
          settings={settings}
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
              <Box sx={{ width: "100%", margin: 2 }}>
                <Box>
                  <Checkbox
                    onChange={(e, v) =>
                      setSettings({
                        ...settings,
                        unmuteFocussedChannels: v,
                      })
                    }
                    checked={settings.unmuteFocussedChannels}
                  />
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
                  />
                  Switch Chat to first focussed channel
                </Box>
                <Box sx={{ marginTop: 2 }}>
                  <Typography variant="subtitle1">
                    Max Focussed Channels
                  </Typography>
                  <Slider
                    value={settings.maxFocussedChannels || 2}
                    onChange={(e, value) =>
                      setSettings({ ...settings, maxFocussedChannels: value })
                    }
                    step={1}
                    min={1}
                    max={10}
                    valueLabelDisplay="auto"
                  />
                </Box>
                <Box sx={{ marginTop: 2 }}>
                  <Typography variant="subtitle1">
                    Max Total Channels
                  </Typography>
                  <Slider
                    value={settings.maxTotalChannels || 10}
                    onChange={(e, value) =>
                      setSettings({ ...settings, maxTotalChannels: value })
                    }
                    step={1}
                    min={1}
                    max={20}
                    valueLabelDisplay="auto"
                  />
                </Box>
                <Box sx={{ marginTop: 2 }}>
                  <Typography variant="subtitle1">
                    Minimum Total Channels
                  </Typography>
                  <Slider
                    value={settings.minTotalChannels || 3}
                    onChange={(e, value) =>
                      setSettings({ ...settings, minTotalChannels: value })
                    }
                    step={1}
                    min={1}
                    max={20}
                    valueLabelDisplay="auto"
                  />
                </Box>
              </Box>
            </TabPanel>
          </TabContext>
        </Drawer>
      </Box>
    </>
  );
}

export default PaceManPage;
