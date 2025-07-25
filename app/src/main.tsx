import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@emotion/react";
import { createTheme, CssBaseline } from "@mui/material";

import MainLayout from "./components/MainLayout";
import PrivateRoute, { ROUTE_LOGIN } from "./components/Security/PrivateRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import PageAlbum from "./pages/PageAlbum";
import PageArtist from "./pages/PageArtist";
import PageMix from "./pages/PageMix";
import PagePlaylist from "./pages/PagePlaylist";
import PageTrack from "./pages/PageTrack";
import { APIFetcherProvider } from "./provider/ApiFetcherProvider";
import { AuthProvider } from "./provider/AuthProvider";
import { ConfigProvider } from "./provider/ConfigProvider";

import "./index.css";

const darkTheme = createTheme({
  customColors: {
    gold: "#a57c00",
    alert: "#e47964",
  },
  palette: {
    mode: "dark",
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
                  <Route path="/artist/:id" element={<PageArtist />} />
                  <Route path="/mix/:id" element={<PageMix />} />
                  <Route path="/playlist/:id" element={<PagePlaylist />} />
                  <Route path="/album/:id" element={<PageAlbum />} />
                  <Route path="/track/:id" element={<PageTrack />} />
                </Route>
              </Route>
            </Routes>
          </AuthProvider>
        </ConfigProvider>
      </APIFetcherProvider>
    </BrowserRouter>
  </ThemeProvider>,
);
