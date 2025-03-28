import { useState } from "react";
import { Image } from "@mui/icons-material";

const Placeholder = () => {
  return (
    <div
      style={{
        alignItems: "center",
        background:
          "linear-gradient(180deg, rgba(20,20,20,1) 0%, rgba(50,50,50,1) 100%)",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        left: 0,
        position: "absolute",
        top: 0,
        width: "100%",
      }}
    >
      <Image sx={{ color: "white", opacity: 0.3, fontSize: "3rem" }} />
    </div>
  );
};

export default function ImageLazy(
  props: React.ImgHTMLAttributes<HTMLImageElement>,
) {
  const [loaded, setLoaded] = useState(false);

  function handleImageLoaded() {
    setLoaded(true);
  }

  const imgProps: React.ImgHTMLAttributes<HTMLImageElement> = {
    alt: "",
    ...props,
    onLoad: () => handleImageLoaded(),
    style: {
      ...props?.style,
      opacity: !loaded ? 0 : 1,
    },
  };

  return (
    <div
      style={{ width: props.width, height: props.height, position: "relative" }}
    >
      {!loaded && <Placeholder />}
      <img {...imgProps} />
    </div>
  );
}
