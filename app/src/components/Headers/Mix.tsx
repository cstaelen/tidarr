import { Alert, AlertTitle, Box } from "@mui/material";
import Typography from "@mui/material/Typography";
import { MixType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";

import PageHeader from "./Header";

export default function Mix({ mix }: { mix: MixType }) {
  return (
    <>
      <PageHeader
        title={mix.title}
        url={mix.url || ""}
        image={mix.images.SMALL.url}
        subtitle="Mix"
        beforeTitle={<>Mix/Radio</>}
        afterTitle={
          <>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              component="span"
              style={{ lineHeight: 1 }}
            >
              {` `}by{` `}
              <strong>{mix.subTitle}</strong>
            </Typography>
            <Box mt={2}>
              <DownloadButton
                item={mix}
                id={mix.id}
                type="mix"
                label="Get mix"
              />
            </Box>
          </>
        }
      />
      <Alert color="info" sx={{ my: 2 }}>
        <AlertTitle>Mix download process</AlertTitle>
        <p>
          The mix will be imported in a new playlist before being downloaded.
          <br />
          At the end, the playlist will be removed.
        </p>
      </Alert>
    </>
  );
}
