import { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { List, MusicNote } from "@mui/icons-material";
import { styled } from "@mui/material";

export default function CoverLink({
  url,
  style,
  children,
}: {
  url: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <Link
      to={url}
      style={{
        ...style,
        lineHeight: 0,
        position: "relative",
        textDecoration: "none",
      }}
    >
      {children}
      <Overlay>
        <div>
          <MusicNote />
          <List />
        </div>
      </Overlay>
    </Link>
  );
}

const Overlay = styled("div")`
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  height: 100%;
  width: 100%;
  transition: opacity 250ms ease-out;

  &:hover {
    opacity: 1;
  }
`;
