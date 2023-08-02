"use client";

import { Input, TextField } from "@mui/material";
import { useTidalProvider } from "../provider/TidalProvider";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const Search = () => {
  const { actions } = useTidalProvider();
  const params = useSearchParams();

  return (
    <form onSubmit={actions.performSearch}>
      <TextField
        id="filled-basic"
        placeholder="Type an artist, album or track title"
        label="Tidal search"
        margin="normal"
        variant="filled"
        defaultValue={params?.get("query") || ''}
        fullWidth
      />
    </form>
  );
};
