import { Box, Chip } from "@mui/material";
import Typography from "@mui/material/Typography";
import { MixType } from "src/types";

import { DownloadButton } from "../Buttons/DownloadButton";
import SyncButton from "../Buttons/SyncButton";

import PageHeader from "./Header";

export default function Mix({ mix, total }: { mix: MixType; total: number }) {
  return (
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
          <Box mt={2} gap={1} display="flex">
            <Chip label={`${total} tracks`} />
            <SyncButton item={mix} type="mix" />
            <DownloadButton item={mix} id={mix.id} type="mix" label="Get mix" />
          </Box>
        </>
      }
    />
  );
}
