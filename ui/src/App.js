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
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import CollectionPage from "./CollectionPage";
import PaceManPage from "./PaceManPage";


function App() {
  // Get Collection UUID from the url
  const router = createBrowserRouter([
    {
      path: "/",
      element: <CollectionPage />,
    },
    {
      path: "/paceman",
      element: <PaceManPage />,
    },
  ]);

  const darkTheme = createTheme({
    palette: {
      mode: "dark",
    },
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
