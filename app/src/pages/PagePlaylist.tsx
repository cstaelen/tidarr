import { useParams } from "react-router-dom";
import {
  Box,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import PagerButton from "src/components/Buttons/PagerButton";
import PlaylistHeader from "src/components/Headers/Playlist";
import ModuleLoader from "src/components/Skeletons/ModuleLoader";
import Module from "src/components/TidalModule/Module";
import NoResult from "src/components/TidalModule/NoResults";
import { usePlaylist } from "src/hooks/usePlaylist";

export default function PagePlaylist() {
  const { id } = useParams();
  const { loading, playlist, tracks, actions, page, total, sortField, sortDirection } = usePlaylist(id);

  if (!loading && !playlist) {
    return <NoResult />;
  }

  return (
    <Container maxWidth="lg">
      {!playlist && loading && <ModuleLoader />}
      {playlist ? (
        <Box
          mb={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <PlaylistHeader playlist={playlist} />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="playlist-sort-label">Sort by</InputLabel>
            <Select
              labelId="playlist-sort-label"
              label="Sort by"
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = (e.target.value as string).split("-");
                actions.setSort(field as any, direction as any);
              }}
            >
              <MenuItem value="dateAdded-desc">
                Date added (newest first)
              </MenuItem>
              <MenuItem value="dateAdded-asc">
                Date added (oldest first)
              </MenuItem>
              <MenuItem value="title-asc">Title (A–Z)</MenuItem>
              <MenuItem value="title-desc">Title (Z–A)</MenuItem>
              <MenuItem value="duration-asc">
                Duration (short → long)
              </MenuItem>
              <MenuItem value="duration-desc">
                Duration (long → short)
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      ) : null}

      <Box>
        <Module type="TRACK_LIST" data={tracks} />
        <PagerButton page={page} setPage={actions.setPage} totalItems={total} />
      </Box>
    </Container>
  );
}
