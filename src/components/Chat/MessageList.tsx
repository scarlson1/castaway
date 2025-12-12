import { useUIMessages } from '@convex-dev/agent/react';
import { Button, Stack, Typography } from '@mui/material';
import { api } from 'convex/_generated/api';
import 'highlight.js/styles/github.css';
import { useEffect, useRef } from 'react';
import { Message } from '~/components/Chat/Message';

export function MessageList({
  threadId,
  stream = false,
}: {
  threadId: string;
  stream?: boolean;
}) {
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
  // const { results, status, loadMore, isLoading } = useThreadMessages(
  //   stream
  //     ? api.agent.streaming.listThreadMessages
  //     : api.agent.chat.listThreadMessages,
  //   { threadId },
  //   { initialNumItems: 10, stream }
  // );
  // const messages = toUIMessages((results as MessageDoc[]) ?? []);
  // console.log('THREADS: ', results, messages);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // if (!results?.length && !isLoading)
  //   return (
  //     <Typography variant='body2' color='textSecondary' gutterBottom>
  //       No messages yet. Start a conversation!
  //     </Typography>
  //   );

  // if (isLoading)
  //   return (
  //     <Typography variant='body2' fontWeight={500} color='textSecondary'>
  //       Loading...
  //     </Typography>
  //   );

  return (
    <Stack spacing={2} sx={{ overflowY: 'auto', flex: 1 }}>
      {/* Messages area - scrollable */}
      {messages.length > 0 ? (
        <>
          {status === 'CanLoadMore' ? (
            <Button onClick={() => loadMore(4)}>Load more</Button>
          ) : null}
          {messages.map((msg, i) => (
            <Message key={msg.key} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </>
      ) : (
        <Typography variant='body2' color='textSecondary' gutterBottom>
          No messages yet. Start a conversation!
        </Typography>
      )}
      {/* {results?.length > 0
        ? toUIMessages(results ?? []).map((m) => (
            <Message key={m.key} message={m} />
          ))
        : null} */}
      {/* {messages.map((msg, i) => (
        <Message key={msg.key} message={msg} />
      ))} */}
      {/* <div ref={messageEndRef} /> */}
    </Stack>
  );
}
