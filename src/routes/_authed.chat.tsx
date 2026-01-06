import { EditNoteRounded } from '@mui/icons-material';
import {
  Box,
  Drawer,
  List,
  ListItemIcon,
  styled,
  Toolbar,
  Typography,
} from '@mui/material';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ThreadsList } from '~/components/Chat/ThreadsList';
import { MuiListItemButtonLink } from '~/components/MuiListItemButtonLink';

const Offset = styled(Box)(({ theme }) => theme.mixins.toolbar);

export const Route = createFileRoute('/_authed/chat')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ flex: '0 0 auto' }}>
        <Offset />
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          height: `calc(100vh - var(--Castaway-header-height))`,
          width: '100%',
        }}
      >
        <ChatSideBar />
        <Box display='flex' flexDirection='column' sx={{ flex: '1 1 auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

const drawerWidth = 260;

function ChatSideBar() {
  return (
    <Drawer
      variant='permanent'
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <Box sx={{ p: 1 }}>
        <List dense>
          <MuiListItemButtonLink
            to='/chat'
            disableGutters
            sx={{ px: 1, borderRadius: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <EditNoteRounded />
            </ListItemIcon>
            <Typography variant='body2' fontSize={'0.95rem'}>
              New chat
            </Typography>
          </MuiListItemButtonLink>
        </List>

        <Typography variant='overline' color='textSecondary'>
          Your chats
        </Typography>
        <Box sx={{ overflow: 'auto' }}>
          <ThreadsList />
        </Box>
      </Box>
    </Drawer>
  );
}
