import { Clear, Search } from "@mui/icons-material";
import { IconButton, InputAdornment, TextField } from "@mui/material";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchFilter({ value, onChange }: Props) {
  return (
    <TextField
      size="small"
      placeholder="Filter by title or artist…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onChange("")}>
                <Clear fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
      }}
      sx={{ minWidth: 220 }}
    />
  );
}
