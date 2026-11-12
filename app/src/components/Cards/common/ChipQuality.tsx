import { Chip, SxProps, Theme, Tooltip } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { MediaMetadataType, QualityType } from "src/types";

const QUALITY_ORDER: QualityType[] = ["low", "normal", "high", "max"];

const QUALITY_STYLES: Record<QualityType, SxProps<Theme>> = {
  max: { color: "warning.main", borderColor: "warning.main" },
  high: { color: "primary.main", borderColor: "primary.main" },
  normal: {},
  low: {},
};

// Tidal reports audioQuality as LOSSLESS even on hi-res releases, so only
// mediaMetadata tags tell the real max quality.
function getQuality(
  audioQuality?: string,
  mediaMetadata?: MediaMetadataType,
): QualityType | undefined {
  const tags = mediaMetadata?.tags || [];

  if (tags.includes("HIRES_LOSSLESS")) return "max";
  if (tags.includes("LOSSLESS") || audioQuality === "LOSSLESS") return "high";
  if (audioQuality === "HIGH") return "normal";
  if (audioQuality === "LOW") return "low";
}

export function ChipQuality({
  audioQuality,
  mediaMetadata,
}: {
  audioQuality?: string;
  mediaMetadata?: MediaMetadataType;
}) {
  const { quality: configuredQuality } = useConfigProvider();
  const quality = getQuality(audioQuality, mediaMetadata);

  if (!quality) return null;

  const label = quality.toUpperCase();
  // -1 when the configured quality is not a known value (config is hand-edited)
  const configIndex = configuredQuality
    ? QUALITY_ORDER.indexOf(configuredQuality)
    : -1;
  const isAboveConfig =
    configIndex >= 0 && QUALITY_ORDER.indexOf(quality) > configIndex;

  return (
    <Tooltip
      describeChild
      title={
        isAboveConfig
          ? `Available in ${label} on Tidal, but downloaded in ${QUALITY_ORDER[configIndex].toUpperCase()} (your settings)`
          : "Best quality available on Tidal"
      }
    >
      <Chip
        label={label}
        aria-label={`Quality: ${label}`}
        size="small"
        variant={"outlined"}
        sx={QUALITY_STYLES[quality]}
      />
    </Tooltip>
  );
}
