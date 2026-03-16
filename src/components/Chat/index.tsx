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
import { useQueueStore } from '~/hooks/useQueueStore';

export const Chat = ({ threadId }: { threadId: string }) => {
  const [stream, setStream] = useState(true);
  const {
    results: messages,
    status,
    loadMore,
    isLoading,
  } = useUIMessages(
    api.agent.streaming.listThreadMessages,
    // stream
    //   ? api.agent.streaming.listThreadMessages
    //   : api.agent.chat.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream },
  );

  const abortStreamByOrder = useMutation(
    api.agent.streaming.abortStreamByOrder,
  );

  const isStreaming = useMemo(
    () => messages.some((m) => m.status === 'streaming'),
    [messages],
  );

  const handleAbortStream = useCallback(() => {
    const order = messages.find((m) => m.status === 'streaming')?.order ?? 0;
    void abortStreamByOrder({ threadId, order });
  }, [messages]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setStream(event.target.checked);
    },
    [],
  );

  const isPlaying = useQueueStore((state) => Boolean(state.nowPlaying));

  const AUDIO_PLAYER_HEIGHT = 73;
  const BOTTOM_NAV_HEIGHT = 56;

  const inputBottom = isPlaying
    ? AUDIO_PLAYER_HEIGHT + BOTTOM_NAV_HEIGHT
    : BOTTOM_NAV_HEIGHT;

  return (
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
          pb: {
            xs: 'calc(var(--Castaway-bottom-nav-height) + var(--Castaway-audio-player-height, 0px) + 80px)',
            md: 2,
          },
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
          px: { xs: 2, md: 0 },
          borderTop: '1px solid',
          borderColor: 'divider',
          position: { xs: 'fixed', md: 'sticky' },
          // bottom: 0, // 20,
          bottom: {
            // xs: 'calc(var(--Castaway-bottom-nav-height) + var(--Castaway-audio-player-height, 0px))',
            xs: inputBottom,
            md: 0,
          },
          display: 'flex',
          gap: 1,
          bgcolor: 'background.default',
          zIndex: 1200,
          left: { xs: 0, md: 'auto' },
          right: { xs: 0, md: 'auto' },
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
