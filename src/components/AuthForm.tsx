import { Typography } from '@mui/material';
import { formOptions } from '@tanstack/react-form';
import { z } from 'zod/v4';
import { withForm } from '~/hooks/form';

const signInSchema = z.object({
  email: z.email('valid email required'),
  password: z.string(),
  remember: z.boolean(),
});

export const signInFormOpts = formOptions({
  defaultValues: {
    email: '',
    password: '',
    remember: false,
  },
  validators: {
    onChange: signInSchema,
  },
});

export const AuthForm = withForm({
  ...signInFormOpts,
  // Optional, but adds props to the `render` function outside of `form`
  props: {
    title: 'Sign in',
    // withForgotPassword: false,
  },
  render: ({ form, title }) => {
    return (
      <>
        <Typography
          component='h1'
          variant='h4'
          sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
        >
          {title}
        </Typography>

        <form.AppField name='email'>
          {({ TextField, state }) => (
            <TextField
              id='email'
              type='email'
              label='Email'
              placeholder='your@email.com'
              autoComplete='email'
              autoFocus
              required
              fullWidth
              variant='outlined'
              color={state.meta.errors.length ? 'error' : 'primary'}
            />
          )}
        </form.AppField>
        <form.AppField name='password'>
          {({ TextField, state }) => (
            <TextField
              id='password'
              type='password'
              label='Password'
              placeholder='••••••'
              autoComplete='current-password'
              required
              fullWidth
              variant='outlined'
              color={state.meta.errors.length ? 'error' : 'primary'}
            />
          )}
        </form.AppField>

        <form.AppField name='remember'>
          {({ Checkbox }) => <Checkbox label='Remember me' />}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton label='Submit' fullWidth />
        </form.AppForm>
      </>
    );
  },
});
