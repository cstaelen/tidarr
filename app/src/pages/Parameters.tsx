import React, { ReactElement } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Description,
  Favorite,
  Headphones,
  List,
  Lock,
  Palette,
  Update,
} from "@mui/icons-material";
import { Box, Container, Portal, Tab, Tabs } from "@mui/material";
import AuthPanel from "src/components/Parameters/AuthPanel";
import CustomCSSPanel from "src/components/Parameters/CustomCSSPanel";
import DocsPanel from "src/components/Parameters/DocsPanel";
import DonatePanel from "src/components/Parameters/DonatePanel";
import TidalPanel from "src/components/Parameters/TidalPanel";
import UpdatePanel from "src/components/Parameters/UpdatePanel";
import VariablesPanel from "src/components/Parameters/VariablesPanel";

const CustomTab = ({ label, icon }: { label: string; icon: ReactElement }) => {
  return (
    <Box display="flex" alignItems="center" gap={1}>
      {icon}
      {label}
    </Box>
  );
};

export const Parameters = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Map tab indices to hash values
  const tabHashes = React.useMemo(
    () => ["updates", "environment", "tidal", "auth", "css", "docs", "donate"],
    [],
  );

  // Get initial tab from URL hash
  const getInitialTab = () => {
    const hash = location.hash.replace("#", "");
    const index = tabHashes.indexOf(hash);
    return index >= 0 ? index : 0;
  };

  const [currentTab, setCurrentTab] = React.useState(getInitialTab());

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    // Update URL hash when tab changes
    navigate(`#${tabHashes[newValue]}`, { replace: true });
  };

  // Listen for hash changes and update active tab
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const index = tabHashes.indexOf(hash);
      if (index >= 0 && index !== currentTab) {
        setCurrentTab(index);
      }
    };

    // Add event listener for hash changes
    window.addEventListener("hashchange", handleHashChange);

    // Cleanup
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [currentTab, tabHashes]);

  return (
    <>
      <Portal container={document.getElementById("app-bar")}>
        <Container maxWidth="lg">
          <Tabs
            value={currentTab}
            onChange={handleChange}
            indicatorColor="secondary"
            textColor="inherit"
            variant={window.innerWidth > 800 ? "fullWidth" : "scrollable"}
            aria-label="Tidal home tabs"
          >
            <Tab label={<CustomTab label="Updates" icon={<Update />} />} />
            <Tab label={<CustomTab label="Env vars" icon={<List />} />} />
            <Tab label={<CustomTab label="Tidal" icon={<Headphones />} />} />
            <Tab label={<CustomTab label="Custom CSS" icon={<Palette />} />} />
            <Tab label={<CustomTab label="Security" icon={<Lock />} />} />
            <Tab label={<CustomTab label="Docs" icon={<Description />} />} />
            <Tab
              sx={{ maxWidth: 2 }}
              label={<CustomTab label="" icon={<Favorite color="error" />} />}
            />
          </Tabs>
        </Container>
      </Portal>
      <Container maxWidth="md">
        {currentTab === 0 && <UpdatePanel />}
        {currentTab === 1 && <VariablesPanel />}
        {currentTab === 2 && <TidalPanel />}
        {currentTab === 3 && <CustomCSSPanel />}
        {currentTab === 4 && <AuthPanel />}
        {currentTab === 5 && <DocsPanel />}
        {currentTab === 6 && <DonatePanel />}
      </Container>
    </>
  );
};
