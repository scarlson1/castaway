import {
  useConvexAction,
  useConvexMutation,
  useConvexPaginatedQuery,
} from '@convex-dev/react-query';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ChatForm, chatFormOpts } from '~/components/ChatForm';
import { useAppForm } from '~/hooks/form';
// import { useThreadMessages } from '@convex-dev/agents/react'

export const Chat = () => {
  const [threadId, setThreadId] = useState();
  const { mutate: createThread, isPending } = useMutation({
    mutationFn: useConvexMutation(api.chatAgent.createThread),
    // onMutate: () => toast.loading(`checking for new episodes`),
    onSuccess: ({ threadId: id }) => {
      setThreadId(id);
    },
    // onError: () => toast.error('something went wrong'),
  });

  return (
    <Container disableGutters maxWidth='sm'>
      <Typography variant='h5' fontWeight='medium' gutterBottom>
        Convex Agent Chat
      </Typography>
      {threadId ? (
        <Stack spacing={2}>
          <ErrorBoundary
            fallback={
              <Typography color='error'>Error displaying thread</Typography>
            }
          >
            <Suspense fallback={<CircularProgress />}>
              <MessageList threadId={threadId} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary
            fallback={<Typography color='error'>Error loading form</Typography>}
          >
            <Suspense>
              <SendMessage threadId={threadId} />
            </Suspense>
          </ErrorBoundary>
        </Stack>
      ) : (
        <Stack spacing={2}>
          <Typography>No thread created yet</Typography>
          <Button onClick={() => createThread({})}>Create thread</Button>
        </Stack>
      )}
    </Container>
  );
};

function MessageList({ threadId }: { threadId: string }) {
  const { results, status, loadMore, isLoading } = useConvexPaginatedQuery(
    api.chatAgent.listThreadMessages,
    { threadId },
    { initialNumItems: 10 }
  );

  if (!results?.length)
    return (
      <Typography variant='body2' color='textSecondary' gutterBottom>
        No messages yet. Start a conversation!
      </Typography>
    );

  return (
    <Stack spacing={2}>
      {results.map((msg) => {
        const isUser = msg.message?.role === 'user';
        return (
          <Paper
            key={msg._id}
            variant='outlined'
            sx={{
              p: 2,
              maxWidth: '80%',
              bgcolor: isUser ? 'gray.800' : 'gray.600',
            }}
          >
            <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: isUser ? 'primary' : 'secondary' }}>
                {isUser ? 'U' : 'A'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant='body2'
                  fontWeight='medium'
                  color='textSecondary'
                >
                  {isUser ? 'you' : 'agent'}
                </Typography>
                <Typography>{msg.text}</Typography>
              </Box>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}

function SendMessage({ threadId }: { threadId: string }) {
  const [response, setResponse] = useState<any>();
  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: useConvexAction(api.chatAgent.sendMessageToAgent),
    onSuccess: (res) => {
      setResponse(res);
    },
  });

  const form = useAppForm({
    ...chatFormOpts,
    onSubmit: async ({ value }) => {
      console.log(value);
      await sendMessage({ threadId, prompt: value.message });
    },
  });

  return (
    <Stack spacing={2}>
      <Box
        component='form'
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        noValidate
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          gap: 2,
        }}
      >
        <ChatForm form={form} />
      </Box>
    </Stack>
  );

  // return (
  //   <Stack spacing={2}>
  //     <form
  //       onSubmit={(e) => {
  //         e.preventDefault();
  //         e.stopPropagation();
  //         form.handleSubmit();
  //       }}
  //     >
  //       <form.Field
  //         name='message'
  //         children={({ state, handleChange, handleBlur }) => {
  //           return (
  //             <TextField
  //               id='message'
  //               label='Message'
  //               defaultValue={state.value}
  //               onChange={(e) => handleChange(e.target.value)}
  //               onBlur={handleBlur}
  //               placeholder='Ask AI about a podcast or episode'
  //               fullWidth
  //             />
  //           );
  //         }}
  //       />
  //       <form.Subscribe
  //         selector={(state) => [state.canSubmit, state.isSubmitting]}
  //         children={([canSubmit, isSubmitting]) => (
  //           <Button type='submit' disabled={!canSubmit} loading={isSubmitting}>
  //             Send
  //           </Button>
  //         )}
  //       />
  //     </form>
  //   </Stack>
  // );
}
