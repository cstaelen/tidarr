import { ReactNode } from "react";
import { Box, Button, CircularProgress } from "@mui/material";

interface ButtonGradientProps {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  endIcon?: ReactNode;
  children: ReactNode;
  size?: "small" | "medium" | "large";
  variant?: "outlined" | "contained" | "text";
  color?: "primary" | "secondary" | "info" | "success" | "error" | "warning";
  gradientFrom?: string;
  gradientTo?: string;
  lightenAmount?: number;
}

/**
 * Lighten a hex color by a percentage
 * @param color - Hex color (e.g., "#883aa2")
 * @param amount - Amount to lighten (0-1, default 0.2 = 20% lighter)
 */
function lightenColor(color: string, amount: number = 0.2): string {
  // Remove # if present
  const hex = color.replace("#", "");

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Lighten by moving towards white (255)
  const newR = Math.min(255, Math.round(r + (255 - r) * amount));
  const newG = Math.min(255, Math.round(g + (255 - g) * amount));
  const newB = Math.min(255, Math.round(b + (255 - b) * amount));

  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

export default function ButtonGradient({
  onClick,
  loading = false,
  disabled = false,
  endIcon,
  children,
  size = "small",
  variant = "outlined",
  color = "info",
  gradientFrom = "#883aa2",
  gradientTo = "#0093cb",
  lightenAmount = 0.2,
}: ButtonGradientProps) {
  // Auto-generate lighter hover colors
  const gradientFromHover = lightenColor(gradientFrom, lightenAmount);
  const gradientToHover = lightenColor(gradientTo, lightenAmount);
  return (
    <Button
      variant={variant}
      color={color}
      endIcon={loading ? <CircularProgress color={color} size={16} /> : endIcon}
      onClick={onClick}
      size={size}
      disabled={disabled || loading}
      sx={{
        position: "relative",
        borderColor: "transparent",
        borderWidth: 1,
        borderStyle: "solid",
        background: "transparent",
        backgroundClip: "padding-box",

        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          margin: "-1px",
          padding: "1px",
          background: `linear-gradient(45deg, ${gradientFrom}, ${gradientTo})`,
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          pointerEvents: "none",
        },
        "&:hover": {
          backgroundColor: "var(--variant-outlinedBg)",
        },
        "&:hover::before": {
          background: `linear-gradient(45deg, ${gradientFromHover}, ${gradientToHover})`,
        },
      }}
    >
      <Box
        component="span"
        sx={{
          background: `linear-gradient(45deg, ${gradientFromHover}, ${gradientToHover})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {children}
      </Box>
    </Button>
  );
}
