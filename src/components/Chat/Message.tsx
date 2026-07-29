import type { UIMessage } from '@convex-dev/agent';
import { useSmoothText } from '@convex-dev/agent/react';
import { Box, Typography } from '@mui/material';
import 'highlight.js/styles/github.css';
import { ChatMarkdown } from '~/components/Chat/ChatMarkdown';

export function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user';
  const [visibleText] = useSmoothText(message.text, {
    startStreaming: message.status === 'streaming',
  });
  const [reasoningText] = useSmoothText(
    message.parts
      .filter((p) => p.type === 'reasoning')
      .map((p) => p.text)
      .join('\n') ?? '',
    { startStreaming: message.status === 'streaming' },
  );

  if (isUser) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 2,
        }}
      >
        <Box
          sx={[
            {
              maxWidth: '72%',
              px: 1.75,
              py: 1.25,
              bgcolor: '#f4f3ee',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.25,
              fontSize: 13,
              lineHeight: 1.6,
              color: 'text.primary',
            },
            (t) => t.applyStyles('dark', { bgcolor: '#1a1813' }),
          ]}
        >
          {message.text}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      {/* Agent label */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          mb: 1,
        }}
      >
        <Box
          sx={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: 9, color: 'primary.contrastText', lineHeight: 1 }}>
            ✦
          </Typography>
        </Box>
        <Typography
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'text.disabled',
          }}
        >
          castaway
          {message.status === 'streaming' && (
            <Box component='span' sx={{ ml: 0.75, opacity: 0.5 }}>
              ···
            </Box>
          )}
        </Typography>
      </Box>

      {/* Reasoning (if present) */}
      {reasoningText && (
        <Box
          sx={[
            {
              mb: 1.5,
              px: 1.5,
              py: 1,
              bgcolor: 'action.selected',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 0.75,
              borderLeft: '3px solid',
              borderLeftColor: 'divider',
            },
          ]}
        >
          <Typography
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: 'text.secondary',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {reasoningText}
          </Typography>
        </Box>
      )}

      {/* Message content */}
      <Box
        sx={{
          fontSize: 13,
          lineHeight: 1.7,
          color: 'text.primary',
          '& p': { mt: 0, mb: 1.5 },
          '& p:last-child': { mb: 0 },
          '& code': {
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            px: 0.5,
            py: 0.125,
            bgcolor: 'action.selected',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 0.5,
          },
          '& pre': {
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            p: 1.5,
            bgcolor: 'action.selected',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 0.75,
            overflowX: 'auto',
          },
          '& pre code': {
            bgcolor: 'transparent',
            border: 'none',
            p: 0,
            fontSize: 'inherit',
          },
        }}
      >
        <ChatMarkdown content={visibleText || (message.status === 'streaming' ? '···' : '')} />
      </Box>
    </Box>
  );
}
