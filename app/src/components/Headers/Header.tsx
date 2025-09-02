import { ReactNode } from "react";
import styled from "@emotion/styled";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Box, Link, Stack, useMediaQuery, useTheme } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import ImageLazy from "../Cards/common/ImageLazy";

const TitleWithLink = ({ url, title }: { url: string; title: string }) => {
  return (
    <Link
      href={url}
      style={{ lineHeight: 1.2 }}
      target="_blank"
      underline="none"
    >
      <Typography
        component="h1"
        sx={{
          fontSize: { md: 28, xs: 28 },
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
  );
};

export default function PageHeader({
  title,
  image,
  url,
  isDisabled,
  beforeTitle,
  afterTitle,
  subtitle,
}: {
  title: string;
  image: string;
  url: string;
  isDisabled?: boolean;
  beforeTitle?: ReactNode;
  afterTitle?: ReactNode;
  subtitle?: string;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <>
      {isMobile ? (
        <Box sx={{ mb: 1, mt: 4 }}>
          <Typography
            textTransform="uppercase"
            fontSize={14}
            fontWeight="bold"
            color="textSecondary"
            display="flex"
            alignItems="center"
          >
            <IndentStyled />
            {subtitle}
          </Typography>
        </Box>
      ) : (
        <h2 style={{ textTransform: "uppercase" }}>{subtitle}</h2>
      )}
      {isMobile ? (
        <Box sx={{ mb: 2 }}>
          <TitleWithLink title={title} url={url} />
          {beforeTitle}
        </Box>
      ) : null}
      <Card
        sx={{
          position: "relative",
          pointerEvents: !isDisabled ? "inherit" : "none",
          opacity: !isDisabled ? 1 : 0.2,
        }}
      >
        <Stack direction="row">
          <Box
            sx={{
              width: { md: "200px", sm: "130px" },
              lineHeight: 0,
            }}
          >
            <ImageLazy
              height={isMobile ? "130px" : "200px"}
              width={isMobile ? "130px" : "200px"}
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
              {!isMobile && beforeTitle}

              {!isMobile && <TitleWithLink title={title} url={url} />}

              {afterTitle}
            </CardContent>
          </Box>
        </Stack>
      </Card>
    </>
  );
}

const IndentStyled = styled.span`
  border-bottom: 1px solid;
  display: inline-block;
  height: 1px;
  margin-right: 0.5rem;
  width: 1rem;
`;
