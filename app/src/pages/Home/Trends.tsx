import { useEffect } from "react";
import { Box } from "@mui/material";
import Module from "src/components/TidalModule/Module";
import { ModulePager } from "src/components/TidalModule/Pagination";
import { ModuleTitle } from "src/components/TidalModule/Title";
import { useModules } from "src/hooks/useModules";

export default function Trends() {
  const {
    data,
    loading,
    actions: { queryModules },
  } = useModules();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!data && !loading) {
      queryModules(`/pages/home`);
    }
  }, [data, loading, queryModules]);

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
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
    </Box>
  );
}
