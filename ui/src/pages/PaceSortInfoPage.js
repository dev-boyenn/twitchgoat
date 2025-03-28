import React from "react";
import { getAdjustedTime, formatTime } from "../services/pacemanUtils";
import { Typography } from "@mui/material";

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

function PaceSortInfoPage() {
  const exampleSplits = [
    { split: "NETHER", time: 60 },
    { split: "NETHER", time: 90 },
    { split: "NETHER", time: 120 },
    { split: "S1", time: 90 },
    { split: "S1", time: 120 },
    { split: "S1", time: 180 },
    { split: "S2", time: 180 },
    { split: "S2", time: 240 },
    { split: "S2", time: 300 },
    { split: "BLIND", time: 300 },
    { split: "BLIND", time: 360 },
    { split: "BLIND", time: 420 },
    { split: "STRONGHOLD", time: 330 },
    { split: "STRONGHOLD", time: 360 },
    { split: "STRONGHOLD", time: 420 },
    { split: "STRONGHOLD", time: 480 },
    { split: "STRONGHOLD", time: 540 },
    { split: "END ENTER", time: 360 },
    { split: "END ENTER", time: 420 },
    { split: "END ENTER", time: 480 },
    { split: "END ENTER", time: 540 },
  ];

  const sortedSplits = [...exampleSplits].sort((a, b) => {
    const adjustedTimeA = getAdjustedTime(a.split, a.time, null);
    const adjustedTimeB = getAdjustedTime(b.split, b.time, null);
    return adjustedTimeA - adjustedTimeB;
  });

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Pace Sorting Information
      </Typography>

      <div className="tables-container">
        <Typography variant="subtitle1" gutterBottom>
          Original Order
        </Typography>
        <table className="side-by-side-table">
          <thead>
            <tr>
              <th>Split (Time)</th>
              <th>Adjusted Time</th>
            </tr>
          </thead>
          <tbody>
            {exampleSplits.map((splitData, index) => {
              const adjustedTime = getAdjustedTime(
                splitData.split,
                splitData.time,
                null
              );
              return (
                <tr key={index}>
                  <td>
                    <img
                      src={splitIcons[splitData.split]}
                      alt={splitData.split}
                      style={{ width: "24px", height: "24px" }}
                    />
                    {splitData.split} ({formatTime(splitData.time)})
                  </td>
                  <td>{adjustedTime.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <Typography variant="subtitle1" gutterBottom>
          Sorted Order
        </Typography>
        <table className="side-by-side-table">
          <thead>
            <tr>
              <th>Split (Time)</th>
              <th>Adjusted Time</th>
            </tr>
          </thead>
          <tbody>
            {sortedSplits.map((splitData, index) => {
              const adjustedTime = getAdjustedTime(
                splitData.split,
                splitData.time,
                null
              );
              return (
                <tr key={index}>
                  <td>
                    <img
                      src={splitIcons[splitData.split]}
                      alt={splitData.split}
                      style={{ width: "24px", height: "24px" }}
                    />
                    {splitData.split} ({formatTime(splitData.time)})
                  </td>
                  <td>{adjustedTime.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PaceSortInfoPage;
