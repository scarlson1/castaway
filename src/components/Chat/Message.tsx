import type { UIMessage } from '@convex-dev/agent';
import { useSmoothText } from '@convex-dev/agent/react';
import { Avatar, Box, Paper, Stack, Typography } from '@mui/material';
import 'highlight.js/styles/github.css';
import { ChatMarkdown } from '~/components/Chat/ChatMarkdown';

export function Message({ message }: { message: UIMessage }) {
  const [visibleText] = useSmoothText(message.text, {
    startStreaming: message.status === 'streaming',
  });
  const isUser = message.role === 'user';
  // const isUser = msg.message?.role === 'user';

  return (
    <Paper
      variant='outlined'
      sx={[
        () => ({
          p: 2,
          maxWidth: '80%',
          // bgcolor: isUser ? 'gray.800' : 'gray.600',
          backgroundColor: isUser ? 'info.light' : 'grey.100',
          // ml: isUser ? 'auto !important' : 0,
          // mr: isUser ? 0 : 'auto !important',
          alignSelf: isUser ? 'flex-end' : 'flex-start',
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
          alignItems: 'flex-start', // 'center',
        }}
      >
        <Avatar sx={{ bgcolor: isUser ? 'primary' : 'secondary' }}>
          {isUser ? 'U' : 'A'}
        </Avatar>
        <Box
          sx={{
            flex: 1,
            minWidth: 0, // allows flex item to shrink
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          }}
        >
          <Typography variant='body2' fontWeight='medium' color='textSecondary'>
            {isUser ? 'you' : 'agent'}
          </Typography>

          {/* <ChatMarkdown content={message.text || '...'} /> */}
          <ChatMarkdown content={visibleText || '...'} />
        </Box>
      </Stack>
    </Paper>
  );
}
