import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { formatTime } from "../services/pacemanUtils";

// Split icons mapping - using Minecraft-themed icons from paceman.gg
const splitIcons = {
  NETHER: "https://paceman.gg/stats/nether.webp", // Nether icon
  S1: "https://paceman.gg/stats/bastion.webp", // Bastion icon (Structure 1)
  S2: "https://paceman.gg/stats/fortress.webp", // Fortress icon (Structure 2)
  BLIND: "https://paceman.gg/stats/first_portal.webp", // First Portal icon (Blind)
  STRONGHOLD: "https://paceman.gg/stats/stronghold.webp", // Stronghold icon
  "END ENTER": "https://paceman.gg/stats/end.webp", // End icon
  FINISH: "https://paceman.gg/stats/finish.webp", // Finish icon
};

// Fallback to text labels if images don't load
const splitLabels = {
  NETHER: "Nether",
  S1: "S1",
  S2: "S2",
  BLIND: "Blind",
  STRONGHOLD: "SH",
  "END ENTER": "End",
};

/**
 * Pace overlay component
 * @param {Object} props - Component props
 * @param {string} props.split - The current split
 * @param {number} props.time - The time in seconds
 * @param {string} props.name - The runner's name
 * @param {number} props.pb - The runner's PB time
 * @param {Object} props.debugInfo - Debug information about timing and ranking
 * @param {Object} props.settings - User settings
 * @param {string} props.skinUrl - The URL of the player's skin
 * @returns {JSX.Element} The pace overlay component
 */
const PaceOverlay = ({
  split,
  time,
  name,
  pb,
  debugInfo,
  settings,
  skinUrl,
}) => {
  // Use state to track if image failed to load
  const [imageError, setImageError] = useState(false);

  if (!split || !time) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        top: "10px",
        left: "10px",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "5px 10px",
        borderRadius: "4px",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
        }}
      >
        {skinUrl && (
          <img
            src={skinUrl}
            alt={name}
            style={{ width: "24px", height: "24px", borderRadius: "50%" }}
            onError={() => setImageError(true)}
          />
        )}
        {splitIcons[split] && !imageError ? (
          <img
            src={splitIcons[split]}
            alt={split}
            style={{ width: "24px", height: "24px" }}
            onError={() => setImageError(true)}
          />
        ) : (
          <span
            style={{
              fontWeight: "bold",
              color:
                split === "NETHER"
                  ? "#9b59b6"
                  : split === "S1"
                  ? "#f1c40f"
                  : split === "S2"
                  ? "#34495e"
                  : split === "BLIND"
                  ? "#2ecc71"
                  : split === "STRONGHOLD"
                  ? "#95a5a6"
                  : split === "END ENTER"
                  ? "#3498db"
                  : "white",
            }}
          >
            {splitLabels[split] || split}
          </span>
        )}
        <Typography variant="body2">{formatTime(time)}</Typography>
      </Box>
      {name && (
        <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
          {name} {pb ? `(PB: ${formatTime(pb)})` : ""}
        </Typography>
      )}

      {/* Debug information - only show if debugInfo exists and showDebugInfo setting is enabled */}
      {debugInfo && settings && settings.showDebugInfo && (
        <>
          <Typography
            variant="body2"
            sx={{ fontSize: "0.75rem", color: "#aaa" }}
          >
            Est:{" "}
            {debugInfo.estimatedTime
              ? formatTime(debugInfo.estimatedTime)
              : "N/A"}
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontSize: "0.75rem", color: "#aaa" }}
          >
            Using: {debugInfo.usedSplit || split}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.75rem",
              color: debugInfo.usedSplit === split ? "#8f8" : "#aaa",
            }}
          >
            Curr:{" "}
            {debugInfo.currentSplitScore
              ? debugInfo.currentSplitScore.toFixed(2)
              : "N/A"}
          </Typography>
          {debugInfo.nextSplit && (
            <Typography
              variant="body2"
              sx={{
                fontSize: "0.75rem",
                color:
                  debugInfo.usedSplit === debugInfo.nextSplit ? "#8f8" : "#aaa",
              }}
            >
              Next:{" "}
              {debugInfo.nextSplitScore
                ? debugInfo.nextSplitScore.toFixed(2)
                : "N/A"}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default PaceOverlay;
