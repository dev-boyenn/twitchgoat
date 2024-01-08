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
import { Button, Checkbox, IconButton, Slider } from "@mui/material";
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";

const goodsplits = {
    'NETHER': 90,
    'S1': 120,
    'S2': 240,
    'BLIND': 300,
    'STRONGHOLD': 400,
    'END ENTER': 420
};



const eventIds = [
    "rsg.enter_nether",
    "rsg.enter_bastion",
    "rsg.enter_fortress",
    "rsg.first_portal",
    "rsg.second_portal",
    "rsg.enter_stronghold",
    "rsg.enter_end",
    "rsg.credits"
];
const progressionBonus = {
    'NETHER': -0.1,
    'S1': 0.1,
    'S2': 0.7,
    'BLIND': 0.8,
    'STRONGHOLD': 0.85,
    'END ENTER': 0.9
};

const getAdjustedTime = (split, time) => {
    // Calculate how close the time is to the good split time
    const timeFactor = time / goodsplits[split];
    // Subtract the progression bonus to reward further stages
    return timeFactor - progressionBonus[split];
};
const secondsTommss = (seconds) => {
    let minutes = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function PaceManPage() {
    const [splitWeight, setSplitWeight] = useState(0.5);
    const [value, setValue] = React.useState("1");
    const [liveChannels, setLiveChannels] = useState([]);
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
        function getPaceChannels() {
            fetch("https://paceman.gg/api/ars/liveruns").then((res) => res.json()).then((data) => {
                const liveRuns = data.filter(run => run.user.liveAccount != null);
                console.log('liveChannels', liveChannels);
                const orderedRuns = liveRuns.map((run) => {
                    const liveAccount = run.user.liveAccount;
                    let split = null;
                    let time = null;
                    if (run.eventList.find(e => e.eventId == "rsg.enter_end")) {
                        split = 'END ENTER';
                        time = run.eventList.find(e => e.eventId == "rsg.enter_end").igt;
                    } else if (run.eventList.find(e => e.eventId == "rsg.enter_stronghold")) {
                        split = 'STRONGHOLD';
                        time = run.eventList.find(e => e.eventId == "rsg.enter_stronghold").igt;
                    } else if (run.eventList.find(e => e.eventId == "rsg.first_portal")) {
                        split = 'BLIND';
                        time = run.eventList.find(e => e.eventId == "rsg.first_portal").igt;
                    } else if (run.eventList.find(e => e.eventId == "rsg.enter_fortress") && run.eventList.find(e => e.eventId == "rsg.enter_bastion")) {
                        split = 'S2';
                        time = Math.max(run.eventList.find(e => e.eventId == "rsg.enter_fortress").igt, run.eventList.find(e => e.eventId == "rsg.enter_bastion").igt);
                    } else if (run.eventList.find(e => e.eventId == "rsg.enter_fortress" || e.eventId == "rsg.enter_bastion")) {
                        split = 'S1';
                        time = run.eventList.find(e => e.eventId == "rsg.enter_fortress" || e.eventId == "rsg.enter_bastion").igt;
                    } else if (run.eventList.find(e => e.eventId == "rsg.enter_nether")) {
                        split = 'NETHER';
                        time = run.eventList.find(e => e.eventId == "rsg.enter_nether").igt;
                    }
                    return {
                        liveAccount,
                        split,
                        time: time/1000
                    }

                }).sort((a, b) => {
                    return getAdjustedTime(a.split, a.time) - getAdjustedTime(b.split, b.time);
                });
                if (orderedRuns.length<3){
                    liveChannels.forEach((channel) => {
                        if (!orderedRuns.find((run) => run.liveAccount == channel) && orderedRuns.length < 3) {
                            orderedRuns.push({
                                liveAccount: channel,
                                split: null,
                                time: null
                            });
                        }
                    });
                }
                if(!(liveChannels.length == orderedRuns.length && liveChannels.every((value, index) => value === orderedRuns[index].liveAccount))){
                    setLiveChannels(orderedRuns.map((run) => run.liveAccount));
                    setFocussedChannels(orderedRuns.slice(0, 2).map((run) => run.liveAccount));
                }

                console.log("orderedRuns", orderedRuns);
            });
        }
        getPaceChannels();
        const interval = setInterval(() => getPaceChannels(), 10000);
        return () => {
            clearInterval(interval);
        };
    }, [liveChannels]);

    const [open, setOpen] = useState(true);
    const [settings, setSettings] = useState(
        JSON.parse(window.localStorage.getItem("settings")) || {}
    );

    useEffect(() => {
        window.localStorage.setItem("settings", JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        if (!!settings.switchChatOnFocus && focussedChanels.length > 0) {
            setChatChannel(focussedChanels[0]);
        }
    }, [focussedChanels, settings.switchChatOnFocus]);


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
            >
                <MenuIcon onClick={() => setOpen(!open)}></MenuIcon>
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

                {/* </Grid> */}
                {/* <Grid item xs={3}> */}
                <Drawer
                    sx={{
                        width: open ? drawerWidth + "px" : "0px",
                        flexSTRONGHOLDrink: 0,
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
        </>
    );
}

export default PaceManPage;
