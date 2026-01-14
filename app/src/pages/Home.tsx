import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Container, Portal, Tab, Tabs, useTheme } from "@mui/material";
import MyFavorites from "src/components/Home/MyFavorites";
import MyMixes from "src/components/Home/MyMixes";
import MyPlaylists from "src/components/Home/MyPlaylists";
import Trends from "src/components/Home/Trends";

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

export default function HomeTabs() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Map tab indices to hash values
  const tabHashes = React.useMemo(
    () => ["trends", "my-mixes", "my-playlists", "my-favorites"],
    [],
  );

  // Get initial tab from URL hash
  const getInitialTab = () => {
    const hash = location.hash.replace("#", "");
    const index = tabHashes.indexOf(hash);
    return index >= 0 ? index : 0;
  };

  const [value, setValue] = React.useState(getInitialTab());

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    // Update URL hash when tab changes
    navigate(`#${tabHashes[newValue]}`, { replace: true });
  };

  // Listen for hash changes and update active tab
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const index = tabHashes.indexOf(hash);
      if (index >= 0 && index !== value) {
        setValue(index);
      }
    };

    // Add event listener for hash changes
    window.addEventListener("hashchange", handleHashChange);

    // Cleanup
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [value, tabHashes]);

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      <Portal container={document.getElementById("app-bar")}>
        <Container maxWidth="lg">
          <Tabs
            value={value}
            onChange={handleChange}
            indicatorColor="secondary"
            textColor="inherit"
            variant={window.innerWidth > 800 ? "fullWidth" : "scrollable"}
            aria-label="Tidal home tabs"
          >
            <Tab label="Tidal Trends" />
            <Tab label="My Mixes" />
            <Tab label="My Playlists" />
            <Tab label="My Favorites" />
          </Tabs>
        </Container>
      </Portal>

      <Container maxWidth="lg">
        <TabPanel value={value} index={0} dir={theme.direction}>
          <Trends />
        </TabPanel>
        <TabPanel value={value} index={1} dir={theme.direction}>
          <MyMixes />
        </TabPanel>
        <TabPanel value={value} index={2} dir={theme.direction}>
          <MyPlaylists />
        </TabPanel>
        <TabPanel value={value} index={3} dir={theme.direction}>
          <MyFavorites />
        </TabPanel>
      </Container>
    </Box>
  );
}
