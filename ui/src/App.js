import "./App.css";
import * as React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import PaceManPage from "./pages/PaceManPage";
import PaceSortInfoPage from "./pages/PaceSortInfoPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  const darkTheme = createTheme({
    palette: {
      mode: "dark",
    },
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/pace-sort-info" element={<PaceSortInfoPage />} />
          <Route path="/" element={<PaceManPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
