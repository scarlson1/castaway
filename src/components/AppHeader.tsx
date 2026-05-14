import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/tanstack-react-start';
import { PersonRounded } from '@mui/icons-material';
import { alpha, Button, GlobalStyles, Stack, styled, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';
import { AutoCompleteSearch } from '~/components/AutoCompleteSearch';
// import { HeaderNavBar } from '~/components/HeaderNavBar';
// import HeaderNavDropdown from '~/components/HeaderNavDropdown';
import CastawayLogo from '~/components/icons/CastawayLogo';
import { MobileSearchDialog } from '~/components/MobileSearchDialog';
import { ModeToggle } from '~/components/ModeToggle';
import { MuiLink } from '~/components/MuiLink';
import { SIDEBAR_WIDTH } from '~/components/AppSidebar';
import type { PodcastFeed } from '~/lib/podcastIndexTypes';

const Header = styled('header')(({ theme }) => [
  {
    position: 'fixed',
    width: '100%',
    top: 0,
    transition: theme.transitions.create('top'),
    zIndex: theme.zIndex.drawer + 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(16px)',
    borderBottom: `1px solid ${(theme.vars || theme).palette.divider}`,
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  } as const,
  theme.applyStyles('dark', {
    backdropFilter: 'blur(16px)',
    backgroundColor: `rgba(${theme.vars.palette.background.paper} / 0.9)`,
  }),
]);

const Navigation = styled('nav')(({ theme }) => [
  {
    '& > div': {
      cursor: 'default',
    },
    '& ul': {
      padding: 0,
      margin: 0,
      listStyle: 'none',
      display: 'flex',
    },
    '& li': {
      ...theme.typography.body2,
      color: (theme.vars || theme).palette.text.secondary,
      // fontWeight: theme.typography.fontWeightSemiBold,
      fontWeight: theme.typography.fontWeightMedium,
      '& > a, & > button': {
        display: 'inline-block',
        color: 'inherit',
        font: 'inherit',
        textDecoration: 'none',
        padding: theme.spacing('6px', '8px'),
        borderRadius: (theme.vars || theme).shape.borderRadius,
        border: '1px solid transparent',
        '&:hover': {
          color: (theme.vars || theme).palette.text.primary,
          backgroundColor: (theme.vars || theme).palette.grey[50],
          borderColor: (theme.vars || theme).palette.grey[100],
          '@media (hover: none)': {
            backgroundColor: 'initial',
            // Reset on touch devices, it doesn't add specificity
          },
        },
        '&:focus-visible': {
          // outline: `3px solid ${alpha(theme.palette.primary[500], 0.5)}`,
          outline: `3px solid ${alpha(theme.palette.primary.main, 0.5)}`,
          outlineOffset: '2px',
        },
      },
    },
  },
  theme.applyStyles('dark', {
    '& li': {
      '& > a, & > button': {
        '&:hover': {
          color: theme.vars.palette.primary.contrastText, // theme.vars.palette.primary[50],
          backgroundColor: alpha(theme.palette.primary.dark, 0.8), // alpha(theme.palette.primaryDark[700], 0.8),
          borderColor: (theme.vars || theme).palette.divider,
        },
      },
    },
  }),
  // theme.applyDarkStyles({
  //   '& li': {
  //     '& > a, & > button': {
  //       '&:hover': {
  //         color: (theme.vars || theme).palette.primary[50],
  //         backgroundColor: alpha(theme.palette.primaryDark[700], 0.8),
  //         borderColor: (theme.vars || theme).palette.divider,
  //       },
  //     },
  //   },
  // }),
]);

const HEIGHT = 60; // TODO: use theme.mixins.toolbar.minHeight ??
export const DESKTOP_HEADER_HEIGHT = 44;

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const goToPod = useCallback(
    (pod: PodcastFeed) => {
      navigate({ to: '/podcast/$podId', params: { podId: pod.id.toString() } });
    },
    [navigate],
  );

  return (
    <Header>
      <GlobalStyles
        styles={(theme) => ({
          ':root': {
            '--Castaway-header-height': `${HEIGHT}px`,
            '--Castaway-bottom-nav-height': '56px',
          },
          [theme.breakpoints.up('md')]: {
            ':root': {
              '--Castaway-header-height': '0px',
            },
          },
        })}
      />
      <Container
        sx={{ display: 'flex', alignItems: 'center', minHeight: HEIGHT }}
      >
        <MuiLink
          to='/'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CastawayLogo sx={{ fontSize: 32, mr: 1 }} />
        </MuiLink>
        <Box sx={{ display: { xs: 'none', md: 'initial' } }}>
          {/* <HeaderNavBar /> */}
          <Navigation>
            <ul>
              <li>
                <MuiLink to='/discover'>Discover</MuiLink>
              </li>
              <li>
                <MuiLink to='/trending'>Trending</MuiLink>
              </li>
              <li>
                <MuiLink to='/podcasts'>Podcasts</MuiLink>
              </li>
              <SignedIn>
                <li>
                  <MuiLink to='/podcasts/feed'>New Episodes</MuiLink>
                </li>
              </SignedIn>
              <SignedIn>
                <li>
                  <MuiLink to='/podcasts/progress'>In Progress</MuiLink>
                </li>
              </SignedIn>
              <SignedIn>
                <li>
                  <MuiLink to='/chat'>Chat</MuiLink>
                </li>
              </SignedIn>
            </ul>
          </Navigation>
        </Box>

        <Stack
          direction='row'
          spacing={1}
          sx={{ alignItems: 'center', ml: 'auto' }}
        >
          <Box sx={{ ml: 'auto', mr: 1 }}>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <AutoCompleteSearch onSelect={goToPod} />
            </Box>
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <MobileSearchDialog />
            </Box>
          </Box>
          {/* <DeferredAppSearch /> */}
          <ModeToggle />
          <SignedIn>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <UserButton />
            </Box>
          </SignedIn>
          <SignedOut>
            <SignInButton mode='modal' fallbackRedirectUrl={location?.href}>
              <Button
                variant='contained'
                color='primary'
                startIcon={<PersonRounded />}
                sx={{
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
        </Stack>
        {/* <Box sx={{ display: { md: 'none' }, ml: 1 }}>
          <HeaderNavDropdown />
        </Box> */}
      </Container>
    </Header>
  );
}

const BREADCRUMB_LABELS: Record<string, string> = {
  '': 'today',
  today: 'today',
  discover: 'discover',
  podcasts: 'podcasts',
  chat: 'ask',
  trending: 'trending',
  settings: 'settings',
};

export function DesktopHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const breadcrumb = useMemo(() => {
    const first = location.pathname.split('/').filter(Boolean)[0] ?? '';
    return BREADCRUMB_LABELS[first] ?? first;
  }, [location.pathname]);

  const goToPod = useCallback(
    (pod: PodcastFeed) => {
      navigate({ to: '/podcast/$podId', params: { podId: pod.id.toString() } });
    },
    [navigate],
  );

  return (
    <Box
      sx={[
        {
          display: { xs: 'none', md: 'flex' },
          position: 'fixed',
          top: 0,
          left: `${SIDEBAR_WIDTH}px`,
          right: 0,
          height: DESKTOP_HEADER_HEIGHT,
          alignItems: 'center',
          px: 4.5,
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: (theme) => theme.zIndex.appBar,
          bgcolor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
        },
        (t) => t.applyStyles('dark', {
          bgcolor: 'rgba(18,17,15,0.85)',
        }),
      ]}
    >
      <Typography
        sx={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.08em',
          color: 'text.disabled',
          flex: 1,
          minWidth: 0,
        }}
      >
        workspace / {breadcrumb}
      </Typography>

      <AutoCompleteSearch onSelect={goToPod} compact />
    </Box>
  );
}
