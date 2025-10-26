import { Link, useNavigate } from "react-router-dom";
import AlbumIcon from "@mui/icons-material/Album";
import { Box, Button, Chip, useTheme } from "@mui/material";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { ArtistType } from "src/types";

import SyncButton from "../Buttons/SyncButton";

import { ArtistAvatar } from "./common/ArtistAvatar";
import CoverLink from "./common/CoverLink";

export default function Artist({ artist }: { artist: ArtistType }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { display } = useConfigProvider();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: display === "small" ? "row" : "column",
        alignItems: display === "small" ? "flex-start" : "center",
      }}
    >
      <CardContent sx={{ flex: "0 0 auto" }}>
        <CoverLink url={`/artist/${artist.id}`}>
          <ArtistAvatar
            alt={artist.name}
            sx={{ width: 100, height: 100 }}
            src={`https://resources.tidal.com/images/${artist?.picture?.replace(
              /-/g,
              "/",
            )}/750x750.jpg`}
          />
        </CoverLink>
      </CardContent>

      <CardContent
        sx={{
          flex: "1 1 0",
          padding: "0.5rem",
          textAlign: display === "small" ? "left" : "center",
        }}
      >
        <Link
          to={`/artist/${artist.id}`}
          style={{
            lineHeight: 1.2,
            color: theme.palette.primary.main,
            textDecoration: "none",
          }}
        >
          <Typography component="span">
            <strong>{artist.name}</strong>
          </Typography>
        </Link>

        <Box sx={{ py: 0.6, minHeight: "2rem" }}>
          {artist.popularity ? (
            <Chip
              label={`Popularity: ${artist.popularity}`}
              variant="outlined"
              size="small"
              color={
                artist.popularity > 75
                  ? "success"
                  : artist.popularity > 33
                    ? "warning"
                    : "error"
              }
            />
          ) : null}
        </Box>

        <Box gap={1} display="flex" sx={{ mt: 1 }}>
          <SyncButton item={artist} type="artist" />
          <Button
            variant="outlined"
            endIcon={<AlbumIcon />}
            onClick={() => {
              navigate(`/artist/${artist.id}`);
            }}
            size="small"
          >
            Discography
          </Button>
        </Box>
      </CardContent>
    </Box>
  );
}
