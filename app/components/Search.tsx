"use client";

import { TextField } from "@mui/material";
import { useSearchProvider } from "../provider/SearchProvider";

export const Search = () => {
  const { actions } = useSearchProvider();

  return (
    <form onSubmit={actions.performSearch}>
      <TextField
        id="filled-basic"
        placeholder="Type an artist, album or track title"
        label="Tidal search"
        margin="normal"
        variant="filled"
        fullWidth
      />
    </form>
  );
};
