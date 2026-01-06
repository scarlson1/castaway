import type { UIMessage } from '@convex-dev/agent';
import { useSmoothText } from '@convex-dev/agent/react';
import { Avatar, Box, Paper, Stack, Typography } from '@mui/material';
// import { ToolUIPart } from 'ai';
import 'highlight.js/styles/github.css';
import { ChatMarkdown } from '~/components/Chat/ChatMarkdown';

export function Message({
  message,
}: // scrollContainerRef,
{
  message: UIMessage;
  // scrollContainerRef: RefObject<HTMLDivElement>;
}) {
  const isUser = message.role === 'user';
  const [visibleText] = useSmoothText(message.text, {
    startStreaming: message.status === 'streaming', // will only return messages with streaming true
  });
  const [reasoningText] = useSmoothText(
    message.parts
      .filter((p) => p.type === 'reasoning')
      .map((p) => p.text)
      .join('\n') ?? '',
    {
      startStreaming: message.status === 'streaming',
    }
  );
  // const nameToolCalls = message.parts.filter(
  //   (p): p is ToolUIPart => p.type === 'tool-getCharacterNames'
  // );

  return (
    <Paper
      variant='outlined'
      sx={[
        () => ({
          p: 2,
          maxWidth: '80%',
          // bgcolor: isUser ? 'gray.800' : 'gray.600',
          backgroundColor: isUser ? 'info.light' : 'grey.100',
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          overflow: 'visible', // allow position: "sticky" for children
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
          {reasoningText && (
            <Typography variant='body2' fontWeight={500} fontSize={'0.825rem'}>
              💭{reasoningText}
            </Typography>
          )}
          {/* {nameToolCalls.map((p) => (
            <Typography
              key={p.toolCallId}
              variant='body2'
              fontWeight={500}
              fontSize={'0.825rem'}
            >
              Names generated:{' '}
              {p.output ? (p.output as string[]).join(', ') : p.state}
              <br />
            </Typography>
          ))} */}

          <ChatMarkdown
            content={isUser ? message.text : visibleText || '...'}
          />
        </Box>
      </Stack>
    </Paper>
  );
}
