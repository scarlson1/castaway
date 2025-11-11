import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/tanstack-react-start';
import { PersonRounded } from '@mui/icons-material';
import { alpha, Button, GlobalStyles, Stack, styled } from '@mui/material';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
// import { HeaderNavBar } from '~/components/HeaderNavBar';
// import HeaderNavDropdown from '~/components/HeaderNavDropdown';
import CastawayLogo from '~/components/icons/CastawayLogo';
// import MuiSvgLogo from '~/components/icons/MuiSvgLogo';
import { ModeToggle } from '~/components/ModeToggle';
import { MuiLink } from '~/components/MuiLink';

const Header = styled('header')(({ theme }) => [
  {
    position: 'sticky',
    top: 0,
    transition: theme.transitions.create('top'),
    zIndex: theme.zIndex.appBar,
    backgroundColor: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(8px)',
    borderBottom: `1px solid ${(theme.vars || theme).palette.divider}`,
  } as const,
  theme.applyStyles('dark', {
    backgroundColor: `rgba(${theme.vars.palette.background.paper} / 0.6)`,
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

interface AppHeaderProps {
  githubRepository?: string;
}

export function AppHeader(props: AppHeaderProps) {
  const { githubRepository = 'https://github.com/scarlson1' } = props;

  return (
    <Header>
      <GlobalStyles
        styles={{
          ':root': {
            '--MuiDocs-header-height': `${HEIGHT}px`,
          },
        }}
      />
      <Container
        sx={{ display: 'flex', alignItems: 'center', minHeight: HEIGHT }}
      >
        {/* <LogoWithCopyMenu /> */}
        <CastawayLogo sx={{ fontSize: 28, mr: 1 }} />
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
            </ul>
          </Navigation>
        </Box>
        <Box sx={{ ml: 'auto' }} />
        <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
          {/* <DeferredAppSearch /> */}
          {/* <Tooltip title='Github' enterDelay={300}>
            <IconButton
              component='a'
              color='primary'
              // size='small'
              href={githubRepository}
              target='_blank'
              rel='noopener'
              data-ga-event-category='header'
              data-ga-event-action='github'
            >
              <GitHub fontSize='inherit' />
            </IconButton>
          </Tooltip> */}

          <ModeToggle />
          <SignedOut>
            {/* <MuiButtonLink to='/auth/signin'>Sign In</MuiButtonLink> */}
            {/* <SignInButton mode='modal' fallbackRedirectUrl={location.href} /> */}
            <SignInButton mode='modal' fallbackRedirectUrl={location.href}>
              <Button
                variant='contained'
                color='primary'
                startIcon={<PersonRounded />} // Optional
                sx={{
                  // Add custom styles to match Clerk's aesthetic, e.g., rounded corners, specific color
                  borderRadius: '8px',
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
          <SignedIn>
            {/* <MuiButtonLink to='/auth/signin'>Sign out</MuiButtonLink> */}
            {/* TODO: account menu */}
            <UserButton />
          </SignedIn>
        </Stack>
        <Box sx={{ display: { md: 'none' }, ml: 1 }}>
          {/* <HeaderNavDropdown /> */}
          TODO: header nav dropdown
        </Box>
      </Container>
    </Header>
  );
}
