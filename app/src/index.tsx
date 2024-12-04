import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@emotion/react";
import { createTheme, CssBaseline } from "@mui/material";

import PrivateRoute, { ROUTE_LOGIN } from "./components/Security/PrivateRoute";
import { AuthProvider } from "./provider/AuthProvider";
import App from "./App";
import Login from "./Login";

import "./index.css";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    gold: "#a57c00",
    alert: "#e47964",
  },
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path={ROUTE_LOGIN} element={<Login />} />
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<App />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
