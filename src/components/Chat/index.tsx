import { optimisticallySendMessage, useUIMessages } from '@convex-dev/agent/react';
import { convexQuery } from '@convex-dev/react-query';
import { ArrowForwardRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import 'highlight.js/styles/github.css';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { MessageList } from '~/components/Chat/MessageList';

type Scope = 'library' | 'all' | 'this';

const SCOPES: { value: Scope; label: string }[] = [
  { value: 'library', label: 'Library' },
  { value: 'all', label: 'All shows' },
  { value: 'this', label: 'This show' },
];

export const Chat = ({ threadId }: { threadId: string }) => {
  const [message, setMessage] = useState('');
  const [scope, setScope] = useState<Scope>('library');

  const { data: threadDetails } = useQuery(
    convexQuery(api.agent.threads.details, { threadId }),
  );

  const {
    results: messages,
    status,
    loadMore,
  } = useUIMessages(
    api.agent.streaming.listThreadMessages,
    { threadId },
    { initialNumItems: 20, stream: true },
  );

  const isStreaming = useMemo(
    () => messages.some((m) => m.status === 'streaming'),
    [messages],
  );

  const abortStreamByOrder = useMutation(api.agent.streaming.abortStreamByOrder);

  const sendMessage = useMutation(
    api.agent.streaming.initiateAsyncStreaming,
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.agent.streaming.listThreadMessages),
  );

  const handleAbort = useCallback(() => {
    const order = messages.find((m) => m.status === 'streaming')?.order ?? 0;
    void abortStreamByOrder({ threadId, order });
  }, [messages, abortStreamByOrder, threadId]);

  const handleSubmit = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed || isStreaming) return;
    setMessage('');
    await sendMessage({ threadId, prompt: trimmed });
  }, [message, isStreaming, sendMessage, threadId]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={[
          {
            flexShrink: 0,
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 2.5,
            py: 1.25,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: 'background.paper',
          },
        ]}
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            flex: '1 1 auto',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {threadDetails?.title || 'thread'}
        </Typography>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1,
            py: 0.375,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 99,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            Scope: My Library
          </Typography>
        </Box>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          px: { xs: 2, sm: 3 },
          pt: 2,
        }}
      >
        <ErrorBoundary
          fallback={<Typography color='error'>Error displaying thread</Typography>}
        >
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>}>
            <MessageList
              threadId={threadId}
              messages={messages}
              status={status}
              loadMore={loadMore}
            />
          </Suspense>
        </ErrorBoundary>
      </Box>

      {/* Input row */}
      <Box
        component='form'
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        sx={[
          {
            flexShrink: 0,
            borderTop: '1px solid',
            borderColor: 'divider',
            p: 1.5,
            display: 'flex',
            gap: 1,
            alignItems: 'flex-end',
            bgcolor: 'background.paper',
          },
        ]}
      >
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {SCOPES.map(({ value, label }) => (
              <Box
                key={value}
                role='button'
                onClick={() => setScope(value)}
                sx={[
                  {
                    px: 1,
                    py: 0.25,
                    borderRadius: 99,
                    fontSize: 10,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    userSelect: 'none',
                    border: '1px solid',
                    transition: 'all 0.1s',
                  },
                  scope === value
                    ? {
                        bgcolor: 'text.primary',
                        color: 'background.default',
                        borderColor: 'text.primary',
                      }
                    : {
                        bgcolor: 'transparent',
                        color: 'text.secondary',
                        borderColor: 'divider',
                        '&:hover': { borderColor: 'text.secondary', color: 'text.primary' },
                      },
                ]}
              >
                {label}
              </Box>
            ))}
          </Box>
          <TextField
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Ask anything across your transcripts...'
            multiline
            maxRows={4}
            fullWidth
            size='small'
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: 13,
                bgcolor: 'background.default',
                borderRadius: 0.75,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'divider',
              },
            }}
          />
        </Box>
        {isStreaming ? (
          <Tooltip title='Stop'>
            <IconButton
              onClick={handleAbort}
              size='small'
              sx={{
                flexShrink: 0,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 0.75,
                p: 0.875,
                mb: 0.125,
              }}
            >
              ⏹
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            type='submit'
            variant='contained'
            disabled={!message.trim()}
            endIcon={<ArrowForwardRounded fontSize='small' />}
            sx={{
              flexShrink: 0,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              px: 1.75,
              py: 0.875,
              borderRadius: 0.75,
              boxShadow: 'none',
              alignSelf: 'flex-end',
              '&:hover': { boxShadow: 'none' },
            }}
          >
            Ask
          </Button>
        )}
      </Box>
    </Box>
  );
};
