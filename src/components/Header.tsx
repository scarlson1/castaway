import {
  AppBar,
  Box,
  Button,
  styled,
  // css,
  // styled,
  Toolbar,
} from '@mui/material';

import { SignedIn, SignedOut, SignInButton } from '@clerk/tanstack-react-start';
import { PersonRounded } from '@mui/icons-material';
import { useLocation } from '@tanstack/react-router';
import { ModeSwitcher } from '~/components/ModeSwitcher';
import { MuiLink } from './MuiLink';

// TODO: delete: use AppHeader instead

const StyledCustomLink = styled(MuiLink)(({ theme }) => [
  {
    color: theme.vars.palette.common.white,
  } as const,
  theme.applyStyles('dark', {
    color: theme.vars.palette.text.primary,
  }),
]);

export function Header() {
  const location = useLocation();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position='static'>
        <Toolbar sx={{ gap: 2 }}>
          <StyledCustomLink to='/' underline='none'>
            Home
          </StyledCustomLink>
          <StyledCustomLink to='/trending' underline='none'>
            Trending
          </StyledCustomLink>

          <Box sx={{ marginLeft: 'auto' }}>
            <ModeSwitcher />
          </Box>
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
          </SignedIn>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
