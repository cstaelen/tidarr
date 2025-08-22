import { Link } from "react-router-dom";
import { Alert, AlertTitle, useTheme } from "@mui/material";
import Typography from "@mui/material/Typography";
import { MixType } from "src/types";

import PageHeader from "./Header";

export default function Mix({ mix }: { mix: MixType }) {
  const theme = useTheme();

  return (
    <>
      <PageHeader
        title={mix.title}
        url={mix.url || ""}
        image={mix.images.SMALL.url}
        subtitle="Mix"
        beforeTitle={<>Mix/Radio</>}
        afterTitle={
          <Typography
            variant="subtitle2"
            color="text.secondary"
            component="span"
            style={{ lineHeight: 1 }}
          >
            {` `}by{` `}
            <strong>{mix.subTitle}</strong>
          </Typography>
        }
      />
      <Alert color="info" sx={{ my: 2 }}>
        <AlertTitle>To download the entire track list :</AlertTitle>
        <ol style={{ paddingLeft: "1.5rem" }}>
          <li>Create a new playlist from the mix/radio</li>
          <li>
            Download the playlist using playlist URL or go to{" "}
            <Link
              to="/my-playlists"
              style={{
                lineHeight: 1,
                color: theme.palette.primary.main,
              }}
            >
              "My Playlists"
            </Link>{" "}
            to download.
          </li>
        </ol>
      </Alert>
    </>
  );
}
