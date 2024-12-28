import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@emotion/react";
import { createTheme, CssBaseline } from "@mui/material";

import MainLayout from "./components/MainLayout";
import PrivateRoute, { ROUTE_LOGIN } from "./components/Security/PrivateRoute";
import ArtistPage from "./pages/ArtistPage";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MixPage from "./pages/MixPage";
import { APIFetcherProvider } from "./provider/ApiFetcherProvider";
import { AuthProvider } from "./provider/AuthProvider";
import { ConfigProvider } from "./provider/ConfigProvider";

import "./index.css";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    gold: "#a57c00",
    alert: "#e47964",
  },
});

function DefaultLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <APIFetcherProvider>
          <ConfigProvider>
            <AuthProvider>
              <Routes>
                <Route path={ROUTE_LOGIN} element={<Login />} />
                <Route element={<PrivateRoute />}>
                  <Route element={<DefaultLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/artist/:id" element={<ArtistPage />} />
                    <Route path="/mix/:id" element={<MixPage />} />
                  </Route>
                </Route>
              </Routes>
            </AuthProvider>
          </ConfigProvider>
        </APIFetcherProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
