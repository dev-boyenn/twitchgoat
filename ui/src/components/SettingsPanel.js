import React from "react";
import {
  Box,
  Checkbox,
  Typography,
  TextField,
  FormControlLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";

/**
 * Settings panel component
 * @param {Object} props - Component props
 * @param {Object} props.settings - User settings
 * @param {Function} props.setSettings - Function to update settings
 * @returns {JSX.Element} The settings panel component
 */
const SettingsPanel = ({ settings, setSettings }) => {
  // Handle dropdown change
  const handleChange = (name) => (event) => {
    setSettings({
      ...settings,
      [name]: event.target.value,
    });
  };
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
        <FormControl fullWidth>
          <InputLabel id="max-focussed-channels-label">
            Max Focussed Channels
          </InputLabel>
          <Select
            labelId="max-focussed-channels-label"
            value={settings.maxFocussedChannels || 2}
            label="Max Focussed Channels"
            onChange={handleChange("maxFocussedChannels")}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <MenuItem key={num} value={num}>
                {num}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Max Total Channels */}
      <Box sx={{ marginBottom: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="max-total-channels-label">
            Max Total Channels
          </InputLabel>
          <Select
            labelId="max-total-channels-label"
            value={settings.maxTotalChannels || 10}
            label="Max Total Channels"
            onChange={handleChange("maxTotalChannels")}
          >
            {[
              1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
              20,
            ].map((num) => (
              <MenuItem key={num} value={num}>
                {num}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Minimum Total Channels */}
      <Box sx={{ marginBottom: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="min-total-channels-label">
            Minimum Total Channels
          </InputLabel>
          <Select
            labelId="min-total-channels-label"
            value={settings.minTotalChannels || 3}
            label="Minimum Total Channels"
            onChange={handleChange("minTotalChannels")}
          >
            {[
              1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
              20,
            ].map((num) => (
              <MenuItem key={num} value={num}>
                {num}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
    </Box>
  );
};

export default SettingsPanel;
