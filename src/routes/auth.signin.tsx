import { SignIn } from '@clerk/tanstack-react-start';
import { Box, useTheme } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import type { ComponentProps } from 'react';
import z from 'zod';

export const signinSearchSchema = z.object({
  redirect_url: z.string().optional(),
  email: z.string().optional(),
  // password: z.string().optional(),
});

export const Route = createFileRoute('/auth/signin')({
  component: RouteComponent,
  validateSearch: (search: unknown) => signinSearchSchema.parse(search),
});

function useClerkAppearance(): ComponentProps<typeof SignIn>['appearance'] {
  const theme = useTheme();

  return {
    layout: { socialButtonsPlacement: 'bottom' },
    variables: {
      colorBorder: theme.vars.palette.divider,
      colorDanger: theme.vars.palette.error.main,
      colorSuccess: theme.vars.palette.success.main,
      // colorModalBackdrop: 'rgba(0, 0, 0, 0.5)' // theme.vars.overlays.
    },
  };
}

function RouteComponent() {
  const search = Route.useSearch(); // ({ select: (s) => s.redirect })
  const appearance = useClerkAppearance();
  console.log('SIGNIN', search);

  return (
    <Box
      sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <SignIn
        appearance={appearance}
        // fallbackRedirectUrl={search.redirect_url || '/'} // use env & search params automatically
        initialValues={{
          emailAddress: search.email || '',
        }}
        routing='path'
        path='/auth/signin'
        signUpUrl='/auth/signup'
      />
    </Box>
  );
}
