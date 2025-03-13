import { Typography } from "@mui/material";



export default function Footer() {
  return (

      <Typography variant="body2" align="center">
        © {new Date().getFullYear()} Frontend Task. All rights reserved.
      </Typography>

  );
}