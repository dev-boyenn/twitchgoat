import React from "react";
import {
  Box,
  Checkbox,
  Typography,
  TextField,
  IconButton,
  FormControlLabel,
  Grid,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { Link } from "react-router-dom";

/**
 * Settings panel component
 * @param {Object} props - Component props
 * @param {Object} props.settings - User settings
 * @param {Function} props.setSettings - Function to update settings
 * @returns {JSX.Element} The settings panel component
 */
const SettingsPanel = ({ settings, setSettings }) => {
  return (
    <Box sx={{ width: "100%", margin: 2 }}>
      <Typography variant="h5" gutterBottom>
        Settings
      </Typography>

      {/* Unmute Focussed Channels */}
      <Box sx={{ marginBottom: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              onChange={(e, v) =>
                setSettings({
                  ...settings,
                  unmuteFocussedChannels: v,
                })
              }
              checked={settings.unmuteFocussedChannels}
            />
          }
          label="Unmute Focussed Channels"
        />
      </Box>

      {/* Switch Chat on Focus */}
      <Box sx={{ marginBottom: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              onChange={(e, v) =>
                setSettings({
                  ...settings,
                  switchChatOnFocus: v,
                })
              }
              checked={settings.switchChatOnFocus}
            />
          }
          label="Switch Chat to First Focussed Channel"
        />
      </Box>

      {/* Show Debug Information */}
      <Box sx={{ marginBottom: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              onChange={(e, v) =>
                setSettings({
                  ...settings,
                  showDebugInfo: v,
                })
              }
              checked={settings.showDebugInfo}
            />
          }
          label="Show Debug Information on Pace Overlay"
        />
      </Box>

      {/* Max Focussed Channels */}
      <Box sx={{ marginBottom: 2 }}>
        <Typography variant="subtitle1">Max Focussed Channels</Typography>
        <Grid container alignItems="center" spacing={1}>
          <Grid item>
            <IconButton
              size="small"
              onClick={() => {
                const currentValue = settings.maxFocussedChannels || 2;
                if (currentValue > 1) {
                  setSettings({
                    ...settings,
                    maxFocussedChannels: currentValue - 1,
                  });
                }
              }}
            >
              <RemoveIcon />
            </IconButton>
          </Grid>
          <Grid item>
            <TextField
              value={settings.maxFocussedChannels || 2}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 1 && value <= 10) {
                  setSettings({ ...settings, maxFocussedChannels: value });
                }
              }}
              inputProps={{ min: 1, max: 10, style: { textAlign: "center" } }}
              variant="outlined"
              size="small"
              sx={{ width: "60px" }}
            />
          </Grid>
          <Grid item>
            <IconButton
              size="small"
              onClick={() => {
                const currentValue = settings.maxFocussedChannels || 2;
                if (currentValue < 10) {
                  setSettings({
                    ...settings,
                    maxFocussedChannels: currentValue + 1,
                  });
                }
              }}
            >
              <AddIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Box>

      {/* Total Channels */}
      <Box sx={{ marginBottom: 2 }}>
        <Typography variant="subtitle1">Total Channels</Typography>
        <Grid container alignItems="center" spacing={1}>
          <Grid item>
            <IconButton
              size="small"
              onClick={() => {
                const currentValue = settings.totalChannels || 3;
                if (currentValue > 1) {
                  setSettings({
                    ...settings,
                    totalChannels: currentValue - 1,
                  });
                }
              }}
            >
              <RemoveIcon />
            </IconButton>
          </Grid>
          <Grid item>
            <TextField
              value={settings.totalChannels || 3}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 1 && value <= 20) {
                  setSettings({ ...settings, totalChannels: value });
                }
              }}
              inputProps={{ min: 1, max: 20, style: { textAlign: "center" } }}
              variant="outlined"
              size="small"
              sx={{ width: "60px" }}
            />
          </Grid>
          <Grid item>
            <IconButton
              size="small"
              onClick={() => {
                const currentValue = settings.totalChannels || 3;
                if (currentValue < 20) {
                  setSettings({
                    ...settings,
                    totalChannels: currentValue + 1,
                  });
                }
              }}
            >
              <AddIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Box>

      {/* Filter Runners */}
      <Box sx={{ marginTop: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Filter Runners (Minecraft Usernames)
        </Typography>
        <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
          Enter one username per line or paste from PacemanBot format
        </Typography>
        <TextField
          multiline
          rows={6}
          fullWidth
          placeholder="boyenn&#10;topimpapig&#10;emia"
          value={settings.filteredRunners}
          onChange={(e) =>
            setSettings({ ...settings, filteredRunners: e.target.value })
          }
          variant="outlined"
          size="small"
        />
      </Box>
      <Link to="/pace-sort-info">Pace Sort Info</Link>
    </Box>
  );
};

export default SettingsPanel;
