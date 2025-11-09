import { OpenInNew } from "@mui/icons-material";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";

interface DocLink {
  title: string;
  description: string;
  url: string;
}

const docLinks: DocLink[] = [
  {
    title: "Tidarr Documentation",
    description: "Main documentation for Tidarr",
    url: "https://github.com/cstaelen/tidarr",
  },
  {
    title: "Tiddl Configuration",
    description: "Tiddl download configuration options",
    url: "https://github.com/oskvr37/tiddl/blob/main/docs/config.example.toml",
  },
  {
    title: "Path Templating",
    description: "Template formatting for download paths",
    url: "https://github.com/oskvr37/tiddl/blob/main/docs/templating.md",
  },
  {
    title: "Tidarr API",
    description: "API documentation for Tidarr",
    url: "https://github.com/cstaelen/tidarr/wiki/Tidarr-API-Documentation",
  },
];

export default function DocsPanel() {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Quick access to documentation resources
      </Typography>
      <List>
        {docLinks.map((doc) => (
          <ListItem
            key={doc.url}
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              mb: 1,
            }}
          >
            <ListItemText
              primary={doc.title}
              secondary={doc.description}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="outlined"
              size="small"
              endIcon={<OpenInNew />}
              onClick={() => window.open(doc.url, "_blank")}
              sx={{ ml: 2 }}
            >
              Open
            </Button>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
