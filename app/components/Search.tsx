"use client";

import { TextField } from "@mui/material";
import { useSearchProvider } from "../provider/SearchProvider";
import { useSearchParams } from "next/navigation";

export const Search = () => {
  const { actions } = useSearchProvider();
  const params = useSearchParams();

  return (
    <form onSubmit={actions.performSearch}>
      <TextField
        id="filled-basic"
        placeholder="Type an artist, album or track title"
        label="Tidal search"
        defaultValue={params.get('query')}
        margin="normal"
        variant="filled"
        fullWidth
      />
    </form>
  );
};
