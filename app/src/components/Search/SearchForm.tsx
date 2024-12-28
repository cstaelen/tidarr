import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TextField } from "@mui/material";

export const SearchForm = () => {
  const [params] = useSearchParams();

  const navigate = useNavigate();

  function performSearch(e: React.SyntheticEvent) {
    e.preventDefault();
    const target = e.target as typeof e.target & HTMLInputElement[];
    const searchString = target?.[0]?.value as string;
    if (searchString) {
      navigate(`/?query=${searchString}`);
      return;
    }

    navigate(`/`);
  }

  return (
    <form onSubmit={performSearch}>
      <TextField
        id="search-input"
        label="Tidal search (keywords, artist URL, album URL, playlist URL)"
        defaultValue={params.get("query")}
        variant="filled"
        fullWidth
        data-testid="search-input"
        margin="none"
      />
    </form>
  );
};
