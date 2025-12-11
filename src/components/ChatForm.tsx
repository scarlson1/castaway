import { formOptions } from '@tanstack/react-form';
import { Suspense } from 'react';
import { z } from 'zod/v4';
import { withForm } from '~/hooks/form';

const chatSchema = z.object({
  message: z.string(),
});

export const chatFormOpts = formOptions({
  defaultValues: {
    message: '',
  },
  validators: {
    onChange: chatSchema,
  },
});

export const ChatForm = withForm({
  ...chatFormOpts,
  // Optional, but adds props to the `render` function outside of `form`
  props: {},
  render: ({ form }) => {
    return (
      <>
        <form.AppField name='message'>
          {({ TextField, state }) => (
            <Suspense>
              <TextField
                id='message'
                label='Message'
                // placeholder='your@email.com'
                autoFocus
                fullWidth
                variant='outlined'
                color={state.meta.errors.length ? 'error' : 'primary'}
              />
            </Suspense>
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton label='Send' fullWidth />
        </form.AppForm>
      </>
    );
  },
});
