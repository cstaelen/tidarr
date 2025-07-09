declare module "@mui/material/styles" {
  interface Theme {
    customColors: {
      gold: string;
      alert: string;
    };
  }

  interface ThemeOptions {
    customColors?: {
      gold?: string;
      alert?: string;
    };
  }
}
