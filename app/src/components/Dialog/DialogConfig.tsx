import React from "react";
import { InfoRounded, Key, List, Palette, Update } from "@mui/icons-material";
import { Tab, Tabs } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";

import CustomCSSPanel from "../Parameters/CustomCSSPanel";
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
      icon={<InfoRounded color="primary" />}
      maxWidth="md"
    >
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="scrollable auto tabs example"
      >
        <Tab label="Updates" icon={<Update />} iconPosition="start" />
        <Tab label="Env vars" icon={<List />} iconPosition="start" />
        <Tab label="Tidal Token" icon={<Key />} iconPosition="start" />
        <Tab label="Custom CSS" icon={<Palette />} iconPosition="start" />
      </Tabs>

      {currentTab === 0 && <UpdatePanel />}
      {currentTab === 1 && <VariablesPanel />}
      {currentTab === 2 && <TidalPanel />}
      {currentTab === 4 && <CustomCSSPanel />}
    </DialogHandler>
  );
};
