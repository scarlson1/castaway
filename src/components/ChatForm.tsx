import { ArrowUpwardRounded } from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';
import { formOptions } from '@tanstack/react-form';
import { z } from 'zod/v4';
import { withForm } from '~/hooks/form';

export const chatSchema = z.object({
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
  props: {
    // actions: null as ReactNode | null | undefined // [] as ReactNode[]
  },
  render: ({ form }) => {
    return (
      <>
        <form.AppField name='message'>
          {({ TextField, state, ...rest }) => (
            <TextField
              id='message'
              label='Message'
              autoFocus
              fullWidth
              variant='outlined'
              color={state.meta.errors.length ? 'error' : 'primary'}
              placeholder='Ask anything'
              // multiline
              // maxRows={4}
              slotProps={{
                input: {
                  endAdornment: (
                    // <Stack direction='row' spacing={1} >
                    //   {/* {actions?.map(a => a)} */}
                    //   {actions}
                    <InputAdornment position='end'>
                      <IconButton
                        aria-label='toggle password visibility'
                        disabled={state.meta.isPristine}
                        onClick={() => {
                          form.handleSubmit();
                        }}
                        type='submit'
                        // onMouseDown={handleMouseDownPassword}
                        edge='end' // Aligns the button flush with the edge
                      >
                        <ArrowUpwardRounded />
                      </IconButton>
                    </InputAdornment>
                    // </Stack>
                  ),
                },
              }}
            />
          )}
        </form.AppField>
        {/* <form.AppForm>
          <form.SubmitButton label='Send' fullWidth />
        </form.AppForm> */}
      </>
    );
  },
});
