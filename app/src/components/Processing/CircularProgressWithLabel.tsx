import { Box, CircularProgress, Tooltip, Typography } from "@mui/material";

type CircularProgressWithLabelProps = {
  current: number;
  total: number;
};

export const CircularProgressWithLabel = ({
  current = 0,
  total = 0,
}: CircularProgressWithLabelProps) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Tooltip title={`Downloading: ${percentage}% (${current}/${total})`} arrow>
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        {/* Background circle (gray) */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={24}
          sx={{
            color: "rgba(255, 255, 255, 0.2)",
          }}
        />
        {/* Foreground circle (progress) */}
        <CircularProgress
          variant="determinate"
          value={percentage}
          size={24}
          sx={{
            position: "absolute",
            left: 0,
          }}
        />
        {/* Percentage label */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
            {percentage}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
};
