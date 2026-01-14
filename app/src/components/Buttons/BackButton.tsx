import { useNavigate } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";
import { IconButton } from "@mui/material";

const BackButton = () => {
  const navigate = useNavigate();

  function goBack() {
    return window.history.length > 0 ? window.history.back() : navigate("/");
  }

  return (
    <IconButton size="small" onClick={() => goBack()}>
      <ArrowBack />
    </IconButton>
  );
};

export default BackButton;
