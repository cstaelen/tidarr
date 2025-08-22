import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { TextField } from "@mui/material";

export const SearchForm = () => {
  const [inputValue, setInputValue] = useState<string>();
  const { pathname } = useLocation();
  const params = useParams();

  const navigate = useNavigate();

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setInputValue(e.target.value);
  }

  function performSearch(e: React.SyntheticEvent) {
    e.preventDefault();
    const target = e.target as typeof e.target & HTMLInputElement[];
    const searchString = target?.[0]?.value as string;
    if (searchString) {
      navigate(`/search/${searchString}`);
      return;
    }

    navigate(`/`);
  }

  useEffect(() => {
    if (pathname === "/") {
      setInputValue("");
      return;
    }
    if (params) {
      setInputValue(params.keywords);
    }
  }, [pathname, params]);

  return (
    <form onSubmit={performSearch}>
      <TextField
        id="search-input"
        label="Tidal search (keywords, artist URL, album URL, playlist URL)"
        value={inputValue || ""}
        variant="filled"
        fullWidth
        data-testid="search-input"
        margin="none"
        onChange={handleInputChange}
      />
    </form>
  );
};
