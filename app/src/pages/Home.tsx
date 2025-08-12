import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Container, Grid } from "@mui/material";
import TypeResults, {
  TidalContentType,
} from "src/components/Results/TypeResults";
import { ModulePager } from "src/components/TidalModule/Pager";
import { useModules } from "src/hooks/useModules";

const MediaTypeMap: { [keyof: string]: TidalContentType } = {
  ALBUM_LIST: "albums",
  VIDEO_LIST: "videos",
  TRACK_LIST: "tracks",
  PLAYLIST_LIST: "playlists",
};

export default function Home() {
  const [value, setValue] = React.useState(0);
  const [params] = useSearchParams();
  const {
    data,
    actions: { queryModules },
  } = useModules();

  useEffect(() => {
    setValue(0);
  }, [params]);

  useEffect(() => {
    window.scrollTo(0, 0);
    queryModules(`/pages/home`);
  }, [value]);

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      <Container maxWidth="lg">
        {data?.rows?.map((row, index1) => (
          <Container
            maxWidth="lg"
            sx={{ mt: 2 }}
            key={`card-${index1}`}
            component="section"
          >
            <Box marginBottom={5}>
              <hr />
              <h2>
                {row.modules[0].title.toLowerCase() === "featured albums"
                  ? "Albums"
                  : row.modules[0].title}{" "}
                ({row.modules[0].pagedList.totalNumberOfItems})
              </h2>
              <hr />
              <br />
              <Grid container spacing={2}>
                {row.modules[0]?.type && (
                  <>
                    <TypeResults
                      type={MediaTypeMap[row.modules[0].type]}
                      data={row.modules[0].pagedList.items}
                    />
                    <ModulePager
                      data={row.modules[0]}
                      type={MediaTypeMap[row.modules[0].type]}
                    />
                  </>
                )}
              </Grid>
            </Box>
          </Container>
        ))}
      </Container>
    </Box>
  );
}
