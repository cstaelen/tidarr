import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Alert, AlertTitle, Box, Link, Stack } from "@mui/material";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { useSearchProvider } from "src/provider/SearchProvider";
import { MixType } from "src/types";

export default function Mix({ mix }: { mix: MixType }) {
  const { display } = useSearchProvider();
  return (
    <>
      <Card sx={{ position: "relative", mb: 2 }}>
        <Stack
          direction={display === "large" ? "column" : "row"}
          alignItems="center"
        >
          <img
            height={200}
            width={200}
            src={mix.images.SMALL.url}
            alt="Live from space album cover"
          />
          <Box
            sx={{
              px: 5,
            }}
          >
            <div style={{ lineHeight: 1.4, flex: "1 1 0" }}>
              Mix/Radio
              <Link
                href={mix.url}
                style={{ lineHeight: 1.2 }}
                target="_blank"
                underline="none"
              >
                <Typography component="h1" style={{ fontSize: 48 }}>
                  <strong>{mix.title}</strong>
                  <OpenInNewIcon
                    style={{
                      verticalAlign: "middle",
                      marginLeft: "0.5rem",
                    }}
                  />
                </Typography>
              </Link>
              {` `}
              <Typography
                variant="subtitle2"
                color="text.secondary"
                component="span"
                style={{ lineHeight: 1 }}
              >
                {` `}by{` `}
                <strong>{mix.subTitle}</strong>
              </Typography>
            </div>
          </Box>
        </Stack>
      </Card>
      <Alert color="info" sx={{ mb: 2 }}>
        <AlertTitle>To download the entire track list :</AlertTitle>
        <ol style={{ paddingLeft: "1.5rem" }}>
          <li>Create a new playlist from the mix/radio</li>
          <li>Download the playlist using playlist URL</li>
        </ol>
      </Alert>
    </>
  );
}
