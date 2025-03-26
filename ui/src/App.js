import "./App.css";
import * as React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PaceManPage from "./PaceManPage";

function App() {
  // Set up router with PaceManPage as the main page
  const router = createBrowserRouter([
    {
      path: "/",
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
