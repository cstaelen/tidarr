import React from "react";
import {
  Description,
  Headphones,
  List,
  Palette,
  Settings,
  Update,
} from "@mui/icons-material";
import { Tab, Tabs } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";

import CustomCSSPanel from "../Parameters/CustomCSSPanel";
import DocsPanel from "../Parameters/DocsPanel";
import TidalPanel from "../Parameters/TidalPanel";
import UpdatePanel from "../Parameters/UpdatePanel";
import VariablesPanel from "../Parameters/VariablesPanel";

import { DialogHandler } from ".";

export const DialogConfig = () => {
  const { isConfigModalOpen, actions } = useConfigProvider();

  const [currentTab, setCurrentTab] = React.useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <DialogHandler
      open={isConfigModalOpen}
      onClose={() => actions.toggleModal(false)}
      title={"Tidarr settings"}
      icon={<Settings color="primary" />}
      maxWidth="md"
      buttons={<div id="portal-config-actions" />}
    >
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        variant="scrollable"
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
        scrollButtons="auto"
        aria-label="scrollable auto tabs example"
      >
        <Tab label="Updates" icon={<Update />} iconPosition="start" />
        <Tab label="Env vars" icon={<List />} iconPosition="start" />
        <Tab
          label="Tidal configuration"
          icon={<Headphones />}
          iconPosition="start"
        />
        <Tab label="Custom CSS" icon={<Palette />} iconPosition="start" />
        <Tab label="Docs" icon={<Description />} iconPosition="start" />
      </Tabs>

      {currentTab === 0 && <UpdatePanel />}
      {currentTab === 1 && <VariablesPanel />}
      {currentTab === 2 && <TidalPanel />}
      {currentTab === 3 && <CustomCSSPanel />}
      {currentTab === 4 && <DocsPanel />}
    </DialogHandler>
  );
};
