import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, Container } from "@mui/material";
import AlbumHeader from "src/components/Headers/Album";
import ModuleLoader from "src/components/Skeletons/ModuleLoader";
import Module from "src/components/TidalModule/Module";
import ModuleNavigation from "src/components/TidalModule/Navigation";
import { ModulePager } from "src/components/TidalModule/Pagination";
import { ModuleTitle } from "src/components/TidalModule/Title";
import { useModules } from "src/hooks/useModules";

export default function Home() {
  const { id } = useParams();

  const {
    data,
    loading,
    actions: { queryModules },
  } = useModules();

  useEffect(() => {
    window.scrollTo(0, 0);
    queryModules(`/v1/pages/album?albumId=${id}`);
  }, [id]);

  const ModuleFilters = ["ALBUM_HEADER"];

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      <Container maxWidth="lg">
        {data && (
          <ModuleNavigation data={data} excludedModules={ModuleFilters} />
        )}

        {data?.rows?.[0]?.modules[0]?.type === "ALBUM_HEADER" &&
          data?.rows?.[0]?.modules[0]?.album && (
            <AlbumHeader album={data.rows[0].modules[0].album} />
          )}
        {data?.rows
          ?.filter(
            (item) =>
              ModuleFilters.indexOf(item.modules[0].type as string) === -1,
          )
          .map((row, index1) => (
            <Box marginBottom={5} key={`block-${index1}`}>
              <ModuleTitle
                title={row.modules[0]?.title}
                total={row.modules[0]?.pagedList?.totalNumberOfItems}
              />
              {row.modules[0]?.type && row.modules[0]?.pagedList?.items && (
                <>
                  <Module
                    type={row.modules[0].type}
                    data={row.modules[0]?.pagedList?.items}
                  />
                  <ModulePager
                    data={row.modules[0]}
                    type={row.modules[0].type}
                  />
                </>
              )}
            </Box>
          ))}
        {loading && <ModuleLoader />}
      </Container>
    </Box>
  );
}
