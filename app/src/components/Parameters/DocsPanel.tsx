import { OpenInNew } from "@mui/icons-material";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

import { ModuleTitle } from "../TidalModule/Title";

interface DocLink {
  title: string;
  description: string;
  url: string;
}

const docLinks: DocLink[] = [
  {
    title: "Tidarr Documentation",
    description: "Getting started, features, and Docker setup",
    url: "https://github.com/cstaelen/tidarr",
  },
  {
    title: "Tiddl Configuration",
    description: "Quality settings, threads, and download options",
    url: "https://github.com/oskvr37/tiddl/blob/main/docs/config.example.toml",
  },
  {
    title: "Path Templating",
    description: "Customize folder structure and file naming",
    url: "https://github.com/oskvr37/tiddl/blob/main/docs/templating.md",
  },
  {
    title: "Lidarr Integration",
    description: "Use Tidarr as indexer and download client",
    url: "https://github.com/cstaelen/tidarr/wiki/Lidarr-Integration-Guide",
  },
  {
    title: "Custom processing scripts",
    description: "Run shell scripts during post-processing",
    url: "https://github.com/cstaelen/tidarr/wiki/Custom-processing-script",
  },
  {
    title: "Tidarr API",
    description: "REST endpoints for automation and scripting",
    url: "https://github.com/cstaelen/tidarr/wiki/Tidarr-API-Documentation",
  },
];

export default function DocsPanel() {
  return (
    <Box>
      <ModuleTitle title="Documentation resources" />
      <List>
        {docLinks.map((doc) => (
          <ListItemButton
            key={doc.url}
            component="a"
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              mb: 1,
            }}
          >
            <ListItemText
              primary={<Typography color="primary">{doc.title}</Typography>}
              secondary={doc.description}
            />
            <ListItemIcon sx={{ minWidth: "auto" }}>
              <OpenInNew />
            </ListItemIcon>
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
