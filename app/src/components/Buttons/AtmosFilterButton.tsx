import { useState } from "react";
import SurroundSoundIcon from "@mui/icons-material/SurroundSound";
import {
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { AtmosFilterType } from "src/types";

const ATMOS_OPTIONS: {
  value: AtmosFilterType;
  label: string;
  tooltip: string;
}[] = [
  { value: "none", label: "No Atmos", tooltip: "Download stereo tracks only" },
  {
    value: "only",
    label: "Atmos only",
    tooltip: "Download Dolby Atmos tracks only",
  },
  {
    value: "allow",
    label: "Atmos allowed",
    tooltip: "Download both stereo and Dolby Atmos tracks",
  },
];

export default function AtmosFilterButton() {
  const { atmosFilter, actions } = useConfigProvider();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isAtmosActive = atmosFilter === "only" || atmosFilter === "allow";

  return (
    <>
      <Tooltip title={`Dolby Atmos: ${atmosFilter ?? "none"}`}>
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label="Dolby Atmos filter"
          size={window.innerWidth > 1024 ? "large" : "small"}
          color={isAtmosActive ? "primary" : "default"}
        >
          <SurroundSoundIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {ATMOS_OPTIONS.map(({ value, label, tooltip }) => (
          <Tooltip key={value} title={tooltip} placement="right">
            <MenuItem
              selected={atmosFilter === value}
              onClick={() => {
                actions.setAtmosFilter(value);
                setAnchorEl(null);
              }}
            >
              <ListItemText primary={label} />
            </MenuItem>
          </Tooltip>
        ))}
      </Menu>
    </>
  );
}
