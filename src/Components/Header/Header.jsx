import { AppBar, Toolbar, Typography } from '@mui/material';
import './Header.css';

export default function Header() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6">Frontend Task - Posts</Typography>
      </Toolbar>
    </AppBar>
  );
}