import { SignedIn, SignedOut, SignInButton } from '@clerk/tanstack-react-start';
import { convexQuery } from '@convex-dev/react-query';
import { PersonRounded } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMatchRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useConvexAuth } from 'convex/react';
import { ModeToggle } from '~/components/ModeToggle';
import { MuiLink } from '~/components/MuiLink';

export const SIDEBAR_WIDTH = 240;

const NAV_LINKS = [
  { label: '⌂ Today', to: '/podcasts/feed' as const, key: '⌘1', auth: true },
  { label: '◎ Discover', to: '/discover' as const, key: '⌘2', auth: false },
  { label: '≡ Podcasts', to: '/podcasts' as const, key: '⌘3', auth: true },
  { label: '⊙ In Progress', to: '/podcasts/progress' as const, key: '⌘4', auth: true },
  { label: '✦ Ask', to: '/chat' as const, key: '⌘K', auth: true },
] as const;

export function AppSidebar() {
  const matchRoute = useMatchRoute();
  const { isAuthenticated } = useConvexAuth();
  const { data: subscriptions } = useQuery({
    ...convexQuery(api.subscribe.allDetails, {}),
    enabled: isAuthenticated,
  });

  const visibleLinks = NAV_LINKS.filter((l) => !l.auth || isAuthenticated);

  const activeTo = [...visibleLinks]
    .sort((a, b) => b.to.length - a.to.length)
    .find(({ to }) => matchRoute({ to, fuzzy: true }))?.to;

  return (
    <Box
      component='aside'
      sx={[
        {
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: SIDEBAR_WIDTH,
          borderRight: '1px solid',
          borderColor: 'divider',
          px: 2.25,
          pt: 2.75,
          pb: 2,
          gap: 2.25,
          zIndex: (t) => t.zIndex.drawer,
          overflowY: 'auto',
          bgcolor: '#f4f3ee',
        },
        (t) => t.applyStyles('dark', { bgcolor: '#161410' }),
      ]}
    >
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.25 }}>
        <Box
          sx={[
            {
              width: 22,
              height: 22,
              bgcolor: 'text.primary',
              borderRadius: '5px',
              flexShrink: 0,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: '6px',
                border: '2px solid',
                borderColor: 'background.default',
                borderRadius: '50%',
                borderBottomColor: 'transparent',
              },
            },
          ]}
        />
        <Typography sx={{ fontWeight: 700, letterSpacing: '-0.03em', fontSize: 20, lineHeight: 1 }}>
          Castaway
        </Typography>
      </Box>

      {/* Navigation */}
      <Box>
        <Typography
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'text.secondary',
            mb: 0.75,
            px: 1.25,
          }}
        >
          Workspace
        </Typography>
        {visibleLinks.map(({ label, to, key }) => {
          const isActive = to === activeTo;
          return (
            <MuiLink
              key={to}
              to={to}
              underline='none'
              sx={[
                {
                  display: 'flex',
                  alignItems: 'center',
                  px: 1.25,
                  py: 1,
                  borderRadius: 1,
                  fontSize: 14,
                  mb: 0.25,
                  transition: 'background 0.12s',
                },
                isActive
                  ? { bgcolor: 'text.primary', color: 'background.default' }
                  : { color: 'text.primary', '&:hover': { bgcolor: 'action.hover' } },
              ]}
            >
              <Box component='span' sx={{ flex: 1 }}>
                {label}
              </Box>
              <Box
                component='span'
                sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, opacity: 0.45 }}
              >
                {key}
              </Box>
            </MuiLink>
          );
        })}
        <SignedOut>
          <SignInButton mode='modal'>
            <Button
              size='small'
              startIcon={<PersonRounded fontSize='small' />}
              sx={{ mt: 0.5, px: 1.25, justifyContent: 'flex-start', fontSize: 14, textTransform: 'none', color: 'text.secondary' }}
            >
              Sign in
            </Button>
          </SignInButton>
        </SignedOut>
      </Box>

      {/* Subscriptions */}
      <SignedIn>
        {subscriptions && subscriptions.length > 0 && (
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <Typography
              sx={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'text.secondary',
                mb: 0.75,
                px: 1.25,
              }}
            >
              Subscriptions · {subscriptions.length}
            </Typography>
            {subscriptions.slice(0, 14).map((pod) => (
              <MuiLink
                key={pod._id}
                to='/podcasts/$podId'
                params={{ podId: pod.podcastId }}
                underline='none'
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 1,
                  fontSize: 13,
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
                }}
              >
                <Box
                  component='img'
                  src={pod.imageUrl || ''}
                  alt={pod.title}
                  sx={{ width: 22, height: 22, borderRadius: '4px', flexShrink: 0, objectFit: 'cover' }}
                />
                <Box
                  component='span'
                  sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {pod.title}
                </Box>
              </MuiLink>
            ))}
          </Box>
        )}
      </SignedIn>

      {/* Bottom: mode toggle */}
      <Box sx={{ mt: 'auto', px: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ModeToggle />
      </Box>
    </Box>
  );
}
