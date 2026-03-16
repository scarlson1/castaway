import { EditNoteRounded, MenuRounded } from '@mui/icons-material';
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemIcon,
  styled,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useState } from 'react';
import { ThreadsList } from '~/components/Chat/ThreadsList';
import { MuiListItemButtonLink } from '~/components/MuiListItemButtonLink';

export const Route = createFileRoute('/_authed/chat')({
  component: RouteComponent,
});

const Offset = styled(Box)(({ theme }) => theme.mixins.toolbar);
const drawerWidth = 260;

function RouteComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

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
        <ChatSideBar
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <Box
          display='flex'
          flexDirection='column'
          sx={{ flex: '1 1 auto', minWidth: 0 }}
        >
          {/* Hamburger — mobile only */}
          {isMobile && (
            <Box sx={{ px: 1, pt: 1, flexShrink: 0 }}>
              <IconButton onClick={() => setMobileOpen(true)} size='small'>
                <MenuRounded />
              </IconButton>
            </Box>
          )}
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

function ChatSideBar({
  isMobile,
  mobileOpen,
  onClose,
}: {
  isMobile: boolean;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const drawerContent = (
    <>
      <Toolbar />
      <List dense sx={{ flexShrink: 0 }}>
        <MuiListItemButtonLink
          to='/chat'
          disableGutters
          onClick={onClose}
          sx={{ px: 1, borderRadius: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <EditNoteRounded />
          </ListItemIcon>
          <Typography variant='body2' fontSize='0.95rem'>
            New chat
          </Typography>
        </MuiListItemButtonLink>
      </List>
      <Typography variant='overline' color='textSecondary'>
        Your chats
      </Typography>
      <Box sx={{ overflowY: 'auto', flex: 1 }}>
        <ThreadsList onSelect={onClose} />
      </Box>
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        variant='temporary'
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            // sit above bottom nav
            pb: 'var(--Castaway-bottom-nav-height)',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant='permanent'
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          p: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );

  // return (
  //   <Drawer
  //     variant='permanent'
  //     sx={{
  //       width: drawerWidth,
  //       flexShrink: 0,
  //       [`& .MuiDrawer-paper`]: {
  //         width: drawerWidth,
  //         boxSizing: 'border-box',
  //         p: 1,
  //         display: 'flex',
  //         flexDirection: 'column',
  //       },
  //     }}
  //   >
  //     <Toolbar />
  //     <List dense sx={{ flexShrink: 0 }}>
  //       <MuiListItemButtonLink
  //         to='/chat'
  //         disableGutters
  //         sx={{ px: 1, borderRadius: 1 }}
  //       >
  //         <ListItemIcon sx={{ minWidth: 32 }}>
  //           <EditNoteRounded />
  //         </ListItemIcon>
  //         <Typography variant='body2' fontSize={'0.95rem'}>
  //           New chat
  //         </Typography>
  //       </MuiListItemButtonLink>
  //     </List>

  //     <Typography variant='overline' color='textSecondary'>
  //       Your chats
  //     </Typography>
  //     <Box sx={{ overflowY: 'auto', flex: 1 }}>
  //       <ThreadsList />
  //     </Box>
  //   </Drawer>
  // );
}
