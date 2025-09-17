import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { FetchTidalSearchProps } from "src/hooks/useFetchTidal";

export type SelectEventType =
  | React.ChangeEvent<
      Omit<HTMLInputElement, "value"> & {
        value: string;
      }
    >
  | (Event & {
      target: {
        value: string;
        name: string;
      };
    })
  | React.ChangeEvent<
      Omit<HTMLInputElement, "value"> & {
        value: number;
      }
    >
  | (Event & {
      target: {
        value: number;
        name: string;
      };
    });

export type SortSelectorProps = {
  data: Partial<FetchTidalSearchProps>;
  handleChange: (e: SelectEventType) => void;
};

export function SortSelector({ data, handleChange }: SortSelectorProps) {
  return (
    <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
      <InputLabel id="demo-simple-select-standard-label">Sort</InputLabel>
      <Select
        labelId="demo-simple-select-standard-label"
        id="demo-simple-select-standard"
        onChange={(e) => handleChange(e)}
        defaultValue={Object.entries(data)[0][0]}
      >
        {Object.entries(data).map(([key]) => (
          <MenuItem value={key}>{key}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
