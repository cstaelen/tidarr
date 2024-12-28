import { Alert, AlertTitle } from "@mui/material";
import Typography from "@mui/material/Typography";
import { MixType } from "src/types";

import PageHeader from "./Header";

export default function Mix({ mix }: { mix: MixType }) {
  return (
    <>
      <PageHeader
        title={mix.title}
        url={mix.url || ""}
        image={mix.images.SMALL.url}
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
          <li>Download the playlist using playlist URL</li>
        </ol>
      </Alert>
    </>
  );
}
