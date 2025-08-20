import { Link, useNavigate } from "react-router-dom";
import AlbumIcon from "@mui/icons-material/Album";
import { Avatar, Box, Button, Chip, Stack, useTheme } from "@mui/material";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { ArtistType } from "src/types";

export default function Artist({ artist }: { artist: ArtistType }) {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex" }}>
      <CardContent>
        <Link to={`/artist/${artist.id}`} style={{ lineHeight: 0 }}>
          <Avatar
            alt={artist.name}
            sx={{ width: 100, height: 100 }}
            src={`https://resources.tidal.com/images/${artist?.picture?.replace(
              /-/g,
              "/",
            )}/750x750.jpg`}
          />
        </Link>
      </CardContent>
      <Box sx={{ display: "flex", flexDirection: "column", flex: "1 1 0" }}>
        <CardContent sx={{ flex: "0 0 auto", padding: "1rem 0.5rem" }}>
          <Stack
            direction="row"
            flexWrap="wrap"
            spacing={1}
            alignItems="center"
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
          </Stack>
          {artist.popularity ? (
            <Stack direction="row" spacing={1} sx={{ py: 1.5 }}>
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
            </Stack>
          ) : null}
          <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              endIcon={<AlbumIcon />}
              onClick={() => {
                navigate(`/artist/${artist.id}`);
              }}
              size="small"
            >
              Show discography
            </Button>
          </Stack>
        </CardContent>
      </Box>
    </Box>
  );
}
