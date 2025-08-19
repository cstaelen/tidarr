import { useEffect } from "react";
import { Box, Container } from "@mui/material";
import Module from "src/components/TidalModule/Module";
import ModuleNavigation from "src/components/TidalModule/Navigation";
import { ModulePager } from "src/components/TidalModule/Pager";
import { ModuleTitle } from "src/components/TidalModule/Title";
import { useModules } from "src/hooks/useModules";

export default function Home() {
  const {
    data,
    loading,
    actions: { queryModules },
  } = useModules();

  useEffect(() => {
    window.scrollTo(0, 0);
    queryModules(`/pages/home`);
  }, []);

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      <Container maxWidth="lg">
        {data && <ModuleNavigation data={data} />}
        {data?.rows?.map((row, index1) => (
          <Box marginBottom={5} key={`block-${index1}`}>
            <ModuleTitle
              title={row.modules[0].title}
              total={row.modules[0].pagedList.totalNumberOfItems}
            />
            {row.modules[0]?.type && (
              <>
                <Module
                  type={row.modules[0].type}
                  data={row.modules[0].pagedList.items}
                  loading={loading}
                />
                <ModulePager data={row.modules[0]} type={row.modules[0].type} />
              </>
            )}
          </Box>
        ))}
      </Container>
    </Box>
  );
}
