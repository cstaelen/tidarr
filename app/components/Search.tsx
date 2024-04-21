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
        id="search-input"
        label="Tidal search (keywords, artist URL, album URL, playlist URL)"
        defaultValue={params.get("query")}
        margin="normal"
        variant="filled"
        fullWidth
        inputProps={{
          "data-testid": "search-input",
        }}
      />
    </form>
  );
};
