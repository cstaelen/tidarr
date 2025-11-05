import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Box, Container } from "@mui/material";
import ArtistHeader from "src/components/Headers/Artist";
import ModuleLoader from "src/components/Skeletons/ModuleLoader";
import Module from "src/components/TidalModule/Module";
import ModuleNavigation from "src/components/TidalModule/Navigation";
import { ModulePager } from "src/components/TidalModule/Pagination";
import { ModuleTitle } from "src/components/TidalModule/Title";
import { useModules } from "src/hooks/useModules";
import { useConfigProvider } from "src/provider/ConfigProvider";

export default function Home() {
  const { id } = useParams();
  const { tiddlConfig } = useConfigProvider();

  const {
    data,
    loading,
    actions: { queryModules },
  } = useModules();

  useEffect(() => {
    window.scrollTo(0, 0);

    queryModules(`/v1/pages/artist?artistId=${id}`);
  }, [id]);

  const ModuleFilters = [
    "ITEM_LIST_WITH_ROLES",
    "ARTICLE_LIST",
    "ARTIST_HEADER",
    "SOCIAL",
  ];

  if (!tiddlConfig?.download.download_video) {
    ModuleFilters.push("VIDEO_LIST");
  }

  const hasVideos: boolean | undefined = useMemo(() => {
    const videoModules = data?.rows?.filter(
      (item) => item.modules[0].type === "VIDEO_LIST",
    );

    const items = videoModules?.[0].modules?.[0].pagedList;

    return items && items?.totalNumberOfItems > 0;
  }, [data?.rows]);

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      <Container maxWidth="lg">
        {data && (
          <ModuleNavigation data={data} excludedModules={ModuleFilters} />
        )}
        {data?.rows?.[0]?.modules[0]?.type === "ARTIST_HEADER" &&
          data?.rows?.[0]?.modules[0]?.artist && (
            <ArtistHeader
              artist={data.rows[0].modules[0].artist}
              showVideos={hasVideos && tiddlConfig?.download.download_video}
            />
          )}
        <div className="list-modules">
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
        </div>
      </Container>
    </Box>
  );
}
