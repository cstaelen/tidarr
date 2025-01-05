import { ReactNode } from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Box, Link, Stack } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

export default function PageHeader({
  title,
  image,
  url,
  isDisabled,
  beforeTitle,
  afterTitle,
}: {
  title: string;
  image: string;
  url: string;
  isDisabled?: boolean;
  beforeTitle?: ReactNode;
  afterTitle?: ReactNode;
}) {
  return (
    <Card
      sx={{
        position: "relative",
        pointerEvents: !isDisabled ? "inherit" : "none",
        opacity: !isDisabled ? 1 : 0.2,
      }}
    >
      <Stack direction="row">
        <Box sx={{ width: { md: "200px", xs: "150px", lineHeight: 0 } }}>
          <img
            height="auto"
            width="100%"
            src={image}
            alt="Live from space album cover"
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flex: "1 1 0",
            position: "relative",
          }}
        >
          <CardContent
            sx={{
              flex: "0 0 auto",
              padding: "0.5rem 1rem !important",
              width: "100%",
            }}
          >
            {beforeTitle}
            <Stack direction="row" flexWrap="wrap" alignItems="center">
              <Link
                href={url}
                style={{ lineHeight: 1.2 }}
                target="_blank"
                underline="none"
              >
                <Typography
                  component="h1"
                  sx={{
                    fontSize: { md: 28, xs: 14 },
                    lineHeight: { md: 1.6, xs: 1.2 },
                    my: 1,
                  }}
                >
                  <strong>{title}</strong>
                  <OpenInNewIcon
                    style={{
                      verticalAlign: "middle",
                      marginLeft: "0.5rem",
                    }}
                  />
                </Typography>
              </Link>
            </Stack>
            {afterTitle}
          </CardContent>
        </Box>
      </Stack>
    </Card>
  );
}
