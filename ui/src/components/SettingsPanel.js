import React from "react";
import {
  Box,
  Checkbox,
  Typography,
  TextField,
  IconButton,
  FormControlLabel,
  Grid,
  Slider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  Avatar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PersonIcon from "@mui/icons-material/Person";
import { Link } from "react-router-dom";

/**
 * Settings panel component
 * @param {Object} props - Component props
 * @param {Object} props.settings - User settings
 * @param {Function} props.setSettings - Function to update settings
 * @param {Array} props.liveChannels - List of live channels (for event mode stream visibility)
 * @returns {JSX.Element} The settings panel component
 */
const SettingsPanel = ({ settings, setSettings, liveChannels = [] }) => {
  // Check if we're in event mode
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event");
  const isEventMode = !!eventId;

  // Helper function to toggle stream visibility
  const toggleStreamVisibility = (streamName) => {
    const hiddenStreams = settings.hiddenStreams || [];
    const isHidden = hiddenStreams.includes(streamName);

    if (isHidden) {
      // Remove from hidden streams
      setSettings({
        ...settings,
        hiddenStreams: hiddenStreams.filter((name) => name !== streamName),
      });
    } else {
      // Add to hidden streams
      setSettings({
        ...settings,
        hiddenStreams: [...hiddenStreams, streamName],
      });
    }
  };

  return (
    <Box sx={{ width: "100%", margin: 2 }}>
      <Typography variant="h5" gutterBottom>
        Settings{" "}
        {isEventMode && (
          <Typography
            component="span"
            variant="caption"
            sx={{ ml: 1, color: "primary.main" }}
          >
            (Event Mode: {eventId})
          </Typography>
        )}
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

      {/* Stream Visibility Management - Only in event mode */}
      {isEventMode && liveChannels.length > 0 && (
        <Box sx={{ marginTop: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Stream Visibility
          </Typography>
          <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
            Hide/show live streams in event mode
          </Typography>
          <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
            {liveChannels.map((channel) => {
              const streamName = channel.liveAccount;
              const displayName =
                channel.minecraftName || channel.name || streamName;
              const isHidden = (settings.hiddenStreams || []).includes(
                streamName
              );

              return (
                <ListItem key={streamName} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {channel.skinUrl ? (
                      <Avatar
                        src={channel.skinUrl}
                        alt={displayName}
                        sx={{
                          width: 24,
                          height: 24,
                          opacity: isHidden ? 0.6 : 1,
                        }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          bgcolor: "grey.500",
                          opacity: isHidden ? 0.6 : 1,
                        }}
                      >
                        <PersonIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={displayName}
                    secondary={streamName}
                    sx={{
                      textDecoration: isHidden ? "line-through" : "none",
                      opacity: isHidden ? 0.6 : 1,
                    }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => toggleStreamVisibility(streamName)}
                      size="small"
                      sx={{
                        color: isHidden ? "text.disabled" : "primary.main",
                      }}
                    >
                      {isHidden ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </Box>
      )}

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

      {/* Always show ( twitch accounts enter separated ) - Hidden in event mode */}
      {!isEventMode && (
        <Box sx={{ marginTop: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Always Show (Twitch Accounts)
          </Typography>
          <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
            Enter one twitch username per line
          </Typography>
          <TextField
            multiline
            rows={6}
            fullWidth
            placeholder="boyenn&#10;topimpapig&#10;emia"
            value={settings.alwaysShowTwitchAccounts}
            onChange={(e) =>
              setSettings({
                ...settings,
                alwaysShowTwitchAccounts: e.target.value,
              })
            }
            variant="outlined"
            size="small"
          />
        </Box>
      )}

      <Link to={`/pace-sort-info${window.location.search}`}>
        Pace Sort Info
      </Link>
    </Box>
  );
};

export default SettingsPanel;
