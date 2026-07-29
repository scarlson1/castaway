import { useConvexMutation } from '@convex-dev/react-query';
import { MenuRounded } from '@mui/icons-material';
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useHotkeys } from '@tanstack/react-hotkeys';
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useState } from 'react';
import { SIDEBAR_WIDTH } from '~/components/AppSidebar';
import { ThreadsList } from '~/components/Chat/ThreadsList';
import { MuiButtonLink } from '~/components/MuiButtonLink';

export const Route = createFileRoute('/_authed/chat')({
  component: RouteComponent,
});

const PANEL_WIDTH = 280;

// const SUGGESTED = [
//   'What did Galloway say about Saudi this...',
//   'Summarize my queue in 5 bullets',
// ];

function RouteComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const panel = <ChatThreadPanel onClose={() => setMobileOpen(false)} />;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 'var(--Castaway-header-height)',
        bottom: {
          xs: 'calc(var(--Castaway-bottom-nav-height) + var(--Castaway-audio-player-height, 0px))',
          md: 'var(--Castaway-audio-player-height, 0px)',
        },
        left: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
        right: 0,
        display: 'flex',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {/* Desktop thread panel */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flexShrink: 0 }}>
        {panel}
      </Box>

      {/* Mobile drawer */}
      <Drawer
        variant='temporary'
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'flex', md: 'none' },
          '& .MuiDrawer-paper': { width: PANEL_WIDTH },
        }}
      >
        {panel}
      </Drawer>

      {/* Main area */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {isMobile && (
          <Box sx={{ px: 1.5, pt: 1.25, pb: 0, flexShrink: 0 }}>
            <IconButton
              size='small'
              onClick={() => setMobileOpen(true)}
              sx={{ borderRadius: 0.75 }}
            >
              <MenuRounded fontSize='small' />
            </IconButton>
          </Box>
        )}
        <Outlet />
      </Box>
    </Box>
  );
}

function ChatThreadPanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();

  useHotkeys([
    {
      hotkey: 'Alt+N',
      callback: () => {
        onClose();
        navigate({ to: '/chat' });
      },
    },
  ]);

  const { mutate: createThread } = useMutation({
    mutationFn: useConvexMutation(api.agent.threads.create),
    onSuccess: ({ threadId }) => {
      onClose();
      navigate({ to: '/chat/$threadId', params: { threadId } });
    },
  });

  return (
    <Box
      sx={[
        {
          width: PANEL_WIDTH,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: '#f4f3ee',
        },
        (t) => t.applyStyles('dark', { bgcolor: '#1a1813' }),
      ]}
    >
      {/* Header: Ask. title */}
      <Box sx={{ px: 2.25, pt: 2.25, pb: 1.5, flexShrink: 0 }}>
        <Typography
          variant='h5'
          sx={{
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            mb: 0.5,
          }}
        >
          Ask.
        </Typography>
        <Typography
          sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.4 }}
        >
          Search across every transcript in your library.
        </Typography>
      </Box>

      {/* New conversation button */}
      <Box sx={{ px: 1.5, pb: 1, flexShrink: 0 }}>
        <MuiButtonLink
          to='/chat'
          fullWidth
          variant='contained'
          size='small'
          onClick={onClose}
          sx={{
            justifyContent: 'space-between',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.04em',
            py: 0.875,
            px: 1.25,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          + New conversation
          <Box
            component='span'
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              opacity: 0.5,
            }}
          >
            ⌥N
          </Box>
        </MuiButtonLink>
      </Box>

      {/* RECENT label */}
      <Typography
        sx={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'text.disabled',
          px: 2,
          pt: 0.5,
          pb: 0.5,
          flexShrink: 0,
        }}
      >
        Recent
      </Typography>

      {/* Thread list */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <ThreadsList onSelect={onClose} />
      </Box>

      {/* SUGGESTED section */}
      {/* <Box
        sx={[
          {
            borderTop: '1px solid',
            borderColor: 'divider',
            px: 2,
            py: 1.5,
            flexShrink: 0,
          },
        ]}
      >
        <Typography
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'text.disabled',
            mb: 1,
          }}
        >
          Suggested
        </Typography>
        {SUGGESTED.map((s) => (
          <Box
            key={s}
            role='button'
            onClick={() =>
              createThread({ initialMessage: { role: 'user', content: s } })
            }
            sx={{
              fontSize: 12,
              color: 'text.secondary',
              py: 0.625,
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              '&:hover': { color: 'text.primary' },
            }}
          >
            {s}
          </Box>
        ))}
      </Box> */}
    </Box>
  );
}
