import { SearchOff } from "@mui/icons-material";
import { Chip, Container } from "@mui/material";

export default function NoResult() {
  return (
    <Container maxWidth="lg" sx={{ textAlign: "center", marginTop: 2 }}>
      <Chip
        icon={<SearchOff />}
        label="No result found :'("
        sx={{ fontWeight: "bold", padding: 1 }}
      />
    </Container>
  );
}
