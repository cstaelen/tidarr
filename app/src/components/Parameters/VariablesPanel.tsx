import { useConfigProvider } from "src/provider/ConfigProvider";

import { ModuleTitle } from "../TidalModule/Title";

import TableParameters from "./common/TableParameters";

export default function VariablesPanel() {
  const { config } = useConfigProvider();
  return (
    <>
      <ModuleTitle title="Environment variables" />
      {config ? (
        <TableParameters rows={Object.entries(config)} />
      ) : (
        "Not found."
      )}
    </>
  );
}
