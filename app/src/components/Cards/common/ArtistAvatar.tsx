import { Avatar, AvatarProps } from "@mui/material";

export const ArtistAvatar = ({ ...props }: AvatarProps) => {
  return (
    <Avatar
      slotProps={{
        img: {
          referrerPolicy: "no-referrer",
        },
      }}
      alt=""
      sx={{ width: 42, height: 42 }}
      {...props}
    />
  );
};
