import React from "react";
import {
  Box,
  Checkbox,
  Slider,
  Typography,
  TextField,
  FormControlLabel,
} from "@mui/material";

/**
 * Settings panel component
 * @param {Object} props - Component props
 * @param {Object} props.settings - User settings
 * @param {Function} props.setSettings - Function to update settings
 * @returns {JSX.Element} The settings panel component
 */
const SettingsPanel = ({ settings, setSettings }) => {
  // Local state to handle slider values before committing them to settings
  const [sliderValues, setSliderValues] = React.useState({
    maxFocussedChannels: settings.maxFocussedChannels || 2,
    maxTotalChannels: settings.maxTotalChannels || 10,
    minTotalChannels: settings.minTotalChannels || 3,
  });

  // Update local state when settings change
  React.useEffect(() => {
    setSliderValues({
      maxFocussedChannels: settings.maxFocussedChannels || 2,
      maxTotalChannels: settings.maxTotalChannels || 10,
      minTotalChannels: settings.minTotalChannels || 3,
    });
  }, [settings]);

  // Handle slider change (updates local state only)
  const handleSliderChange = (name) => (e, value) => {
    setSliderValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle slider change committed (updates settings)
  const handleSliderChangeCommitted = (name) => (e, value) => {
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        <Typography variant="subtitle1">Max Focussed Channels</Typography>
        <Slider
          value={sliderValues.maxFocussedChannels}
          onChange={handleSliderChange("maxFocussedChannels")}
          onChangeCommitted={handleSliderChangeCommitted("maxFocussedChannels")}
          step={1}
          min={1}
          max={10}
          valueLabelDisplay="auto"
        />
      </Box>

      {/* Max Total Channels */}
      <Box sx={{ marginBottom: 2 }}>
        <Typography variant="subtitle1">Max Total Channels</Typography>
        <Slider
          value={sliderValues.maxTotalChannels}
          onChange={handleSliderChange("maxTotalChannels")}
          onChangeCommitted={handleSliderChangeCommitted("maxTotalChannels")}
          step={1}
          min={1}
          max={20}
          valueLabelDisplay="auto"
        />
      </Box>

      {/* Minimum Total Channels */}
      <Box sx={{ marginBottom: 2 }}>
        <Typography variant="subtitle1">Minimum Total Channels</Typography>
        <Slider
          value={sliderValues.minTotalChannels}
          onChange={handleSliderChange("minTotalChannels")}
          onChangeCommitted={handleSliderChangeCommitted("minTotalChannels")}
          step={1}
          min={1}
          max={20}
          valueLabelDisplay="auto"
        />
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
