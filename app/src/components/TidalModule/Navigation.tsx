import { useState } from "react";
import { Container, Portal, Tab, Tabs } from "@mui/material";
import { ModuleListResponseType } from "src/hooks/useModules";
import { a11yProps } from "src/utils/helpers";

export default function ModuleNavigation({
  data,
  excludedModules,
}: {
  data: ModuleListResponseType;
  excludedModules?: string[];
}) {
  const [currentTab, setCurrentTab] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    document.querySelectorAll(".module-title h2")?.[newValue]?.scrollIntoView();
  };

  return (
    <Portal container={document.getElementById("app-bar")}>
      <Container maxWidth="lg">
        <Tabs
          value={currentTab}
          onChange={handleChange}
          indicatorColor="secondary"
          textColor="inherit"
          variant="scrollable"
        >
          {data?.rows
            ?.filter((item) =>
              excludedModules
                ? excludedModules?.indexOf(item.modules[0].type as string) ===
                  -1
                : true,
            )
            ?.filter((item) => item.modules[0].title !== "")
            ?.map((row, index1) => (
              <Tab
                key={`tab-anchor-${index1}`}
                label={`${
                  row?.modules[0].title.toLowerCase() === "featured albums"
                    ? "Albums"
                    : row?.modules[0].title
                } (${row?.modules[0].pagedList?.totalNumberOfItems})`}
                {...a11yProps(index1)}
                sx={{ alignItems: "center" }}
              />
            ))}
        </Tabs>
      </Container>
    </Portal>
  );
}
