import { Navigate, Outlet } from "react-router-dom";
import { useConfigProvider } from "src/provider/ConfigProvider";

/**
 * Settings are admin only. The API already rejects guests: this only keeps
 * the UI from showing a page full of failing requests.
 */
const AdminRoute = () => {
  const { isGuest } = useConfigProvider();

  if (isGuest) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default AdminRoute;
