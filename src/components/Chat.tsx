import type { UIMessage } from '@convex-dev/agent';
import { toUIMessages, useThreadMessages } from '@convex-dev/agent/react';
import { useConvexAction, useConvexMutation } from '@convex-dev/react-query';
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
  // const { results, status, loadMore, isLoading } = useUIMessages(
  //   api.chatAgent.listThreadMessages,
  //   { threadId },
  //   { initialNumItems: 10 /* stream: true */ }
  // );
  const { results, status, loadMore, isLoading } = useThreadMessages(
    api.chatAgent.listThreadMessages,
    { threadId },
    { initialNumItems: 10 }
  );
  // console.log('THREADS: ', messages.results, toUIMessages(messages.results));

  if (!results?.length && !isLoading)
    return (
      <Typography variant='body2' color='textSecondary' gutterBottom>
        No messages yet. Start a conversation!
      </Typography>
    );

  if (isLoading)
    return (
      <Typography variant='body2' fontWeight={500} color='textSecondary'>
        Loading...
      </Typography>
    );

  return (
    <Stack spacing={2}>
      {results?.length > 0
        ? toUIMessages(results ?? []).map((m) => (
            <Message key={m.key} message={m} />
          ))
        : null}
      {/* {results.map((msg, i) => (
        <Message key={msg.key} message={msg} />
      ))} */}
    </Stack>
  );
}

function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user';
  // const isUser = msg.message?.role === 'user';

  return (
    <Paper
      // key={msg._id}
      // key={msg.key}
      variant='outlined'
      sx={[
        () => ({
          p: 2,
          maxWidth: '80%',
          // bgcolor: isUser ? 'gray.800' : 'gray.600',
          backgroundColor: isUser ? 'info.light' : 'grey.100',
          ml: isUser ? 'auto !important' : 0,
          mr: isUser ? 0 : 'auto !important',
        }),
        (theme) =>
          theme.applyStyles('dark', {
            backgroundColor: isUser
              ? theme.palette.primary.dark
              : theme.palette.secondary.dark,
          }),
      ]}
    >
      <Stack
        direction='row'
        spacing={1}
        sx={{
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ bgcolor: isUser ? 'primary' : 'secondary' }}>
          {isUser ? 'U' : 'A'}
        </Avatar>
        <Box
          sx={{
            flex: 1,
          }}
        >
          <Typography variant='body2' fontWeight='medium' color='textSecondary'>
            {isUser ? 'you' : 'agent'}
          </Typography>
          <Typography>{message.text || '...'}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
  // return (
  //   <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
  //     <div
  //       className={`rounded-lg px-4 py-2 max-w-lg whitespace-pre-wrap shadow-sm ${
  //         isUser ? "bg-blue-100 text-blue-900" : "bg-gray-200 text-gray-800"
  //       }`}
  //     >
  //       {message.text || "..."}
  //     </div>
  //   </div>
  // );
}

function SendMessage({ threadId }: { threadId: string }) {
  const [response, setResponse] = useState<any>();
  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: useConvexAction(api.chatAgent.sendMessageToAgent),
    onSuccess: (res) => {
      console.log('mutation finished', res);
      setResponse(res);
    },
  });

  const form = useAppForm({
    ...chatFormOpts,
    onSubmit: async ({ value }) => {
      console.log(value);
      await sendMessage({ threadId, prompt: value.message });
      console.log('resetting form...');
      form.reset();
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
}
