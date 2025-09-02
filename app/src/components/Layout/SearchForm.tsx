import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { TextField } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";

export const SearchForm = () => {
  const [inputValue, setInputValue] = useState<string>();
  const { pathname } = useLocation();
  const { config } = useConfigProvider();
  const params = useParams();
  const navigate = useNavigate();

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setInputValue(e.target.value);
  }

  async function directDownload(url: string) {
    const id = url
      .substring(url.lastIndexOf("/") + 1, url.length)
      .split("?")?.[0];
    const splittedUrl = url.split("/");
    const type = splittedUrl[splittedUrl?.length - 2].split("?")?.[0];

    navigate(`/${type}/${id}`);
  }

  function performSearch(e: React.SyntheticEvent) {
    e.preventDefault();
    const target = e.target as typeof e.target & HTMLInputElement[];
    const searchString = target?.[0]?.value as string;

    if (searchString) {
      if (searchString.substring(0, 4) === "http") {
        directDownload(searchString);
        return;
      }
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
        disabled={!config}
        fullWidth
        data-testid="search-input"
        margin="none"
        onChange={handleInputChange}
      />
    </form>
  );
};
