import { useUIMessages } from '@convex-dev/agent/react';
import {
  Box,
  CircularProgress,
  Container,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import 'highlight.js/styles/github.css';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { MessageList } from '~/components/Chat/MessageList';
import { SendMessage } from '~/components/Chat/SendMessage';
import { StreamingSendMessage } from '~/components/Chat/StreamingSendMessage';

export const Chat = ({ threadId }: { threadId: string }) => {
  const [stream, setStream] = useState(true);
  const {
    results: messages,
    status,
    loadMore,
    isLoading,
  } = useUIMessages(
    stream
      ? api.agent.streaming.listThreadMessages
      : api.agent.chat.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream }
  );

  const abortStreamByOrder = useMutation(
    api.agent.streaming.abortStreamByOrder
  );

  const isStreaming = useMemo(
    () => messages.some((m) => m.status === 'streaming'),
    [messages]
  );
  const handleAbortStream = useCallback(() => {
    const order = messages.find((m) => m.status === 'streaming')?.order ?? 0;
    void abortStreamByOrder({ threadId, order });
  }, [messages]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setStream(event.target.checked);
    },
    []
  );

  return (
    // <Container disableGutters maxWidth='md'>
    //   <Stack
    //     spacing={2}
    //     direction='row'
    //     sx={{ justifyContent: 'space-between' }}
    //   >
    //     <Typography variant='h5' fontWeight='medium' gutterBottom>
    //       Convex Agent Chat
    //     </Typography>

    //   </Stack>

    <Container
      maxWidth='md'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 2,
        }}
      >
        <FormControlLabel
          control={<Switch checked={stream} onChange={handleChange} />}
          label='Streaming'
        />
        <ErrorBoundary
          fallback={
            <Typography color='error'>Error displaying thread</Typography>
          }
        >
          <Suspense fallback={<CircularProgress />}>
            <MessageList
              threadId={threadId}
              messages={messages}
              status={status}
              loadMore={loadMore}
            />
          </Suspense>
        </ErrorBoundary>
      </Box>
      <Box
        sx={{
          pt: 2,
          pb: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          bottom: 0, // 20,
          display: 'flex',
          gap: 1,
          bgcolor: 'background.default',
          zIndex: 1200,
        }}
      >
        {stream ? (
          <ErrorBoundary
            fallback={<Typography color='error'>Error loading form</Typography>}
          >
            <Suspense>
              <StreamingSendMessage
                threadId={threadId}
                abortStream={handleAbortStream}
                isStreaming={isStreaming}
              />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <ErrorBoundary
            fallback={<Typography color='error'>Error loading form</Typography>}
          >
            <Suspense>
              <SendMessage threadId={threadId} />
            </Suspense>
          </ErrorBoundary>
        )}
      </Box>
    </Container>
  );
};
