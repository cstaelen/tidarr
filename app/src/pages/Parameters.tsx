import React, { ReactElement } from "react";
import {
  Description,
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
  const [currentTab, setCurrentTab] = React.useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <>
      <Portal container={document.getElementById("app-bar")}>
        <Container maxWidth="md">
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            indicatorColor="secondary"
            textColor="inherit"
            variant={"scrollable"}
            aria-label="Tidal home tabs"
          >
            <Tab label={<CustomTab label="Updates" icon={<Update />} />} />
            <Tab label={<CustomTab label="Env vars" icon={<List />} />} />
            <Tab label={<CustomTab label="Tidal" icon={<Headphones />} />} />
            <Tab label={<CustomTab label="Custom CSS" icon={<Palette />} />} />
            <Tab label={<CustomTab label="Security" icon={<Lock />} />} />
            <Tab label={<CustomTab label="Docs" icon={<Description />} />} />
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
      </Container>
    </>
  );
};
