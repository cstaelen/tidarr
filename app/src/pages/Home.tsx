import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Container, Tabs, useTheme } from "@mui/material";

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Home() {
  const theme = useTheme();
  const [value, setValue] = React.useState(0);
  const [params] = useSearchParams();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    setValue(0);
  }, [params]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [value]);

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      <Container maxWidth="lg">
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="secondary"
          textColor="inherit"
          variant={window.innerWidth > 800 ? "fullWidth" : "scrollable"}
          aria-label="Tidal result tabs"
        ></Tabs>
      </Container>

      <Container maxWidth="lg">
        <TabPanel value={value} index={0} dir={theme.direction}></TabPanel>
      </Container>
    </Box>
  );
}
