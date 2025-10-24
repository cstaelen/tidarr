import { useConfigProvider } from "src/provider/ConfigProvider";

import TableParameters from "./TableParameters";

export default function VariablesPanel() {
  const { config } = useConfigProvider();
  return (
    <>
      {config ? (
        <TableParameters rows={Object.entries(config)} />
      ) : (
        "Not found."
      )}
    </>
  );
}
