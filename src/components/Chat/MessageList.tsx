import type { UIMessage } from '@convex-dev/agent';
import { Button, CircularProgress, Stack, Typography } from '@mui/material';
import type { UsePaginatedQueryResult } from 'convex/react';
import 'highlight.js/styles/github.css';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { Message } from '~/components/Chat/Message';
import { useEventListener } from '~/hooks/useEventListener';

const SCROLL_THRESHOLD = 50; // px from bottom to still count as "at bottom"

export function MessageList({
  messages,
  loadMore,
  status,
}: // isLoading
{
  messages: UIMessage[];
  loadMore: (numItems: number) => void;
  status: UsePaginatedQueryResult<UIMessage>['status']; // UsePaginatedQueryResult<UIMessagesQueryResult<Query>> // string;
  threadId: string;
  // isLoading
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      console.log('dist from bottom: ', distanceFromBottom);

      setIsAtBottom(distanceFromBottom < SCROLL_THRESHOLD);
    };

    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isAtBottom) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAtBottom]);

  const onScroll = useCallback((e: Event) => {
    // const el = containerRef.current;
    const el = e.target as HTMLElement;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    console.log(
      'setting is at bottom: ',
      distanceFromBottom < SCROLL_THRESHOLD
    );
    setIsAtBottom(distanceFromBottom < SCROLL_THRESHOLD);
  }, []);

  useEventListener(
    'scroll',
    onScroll,
    containerRef as RefObject<HTMLDivElement>
  );

  return (
    <Stack
      ref={containerRef}
      spacing={2}
      sx={{ overflowY: 'auto', flex: 1 }}
      onScroll={console.log}
    >
      {status === 'LoadingFirstPage' ? (
        <CircularProgress size={20} sx={{ alignSelf: 'center' }} />
      ) : //  Messages area - scrollable
      messages.length > 0 ? (
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

      {/* {messages.length > 0 ? (
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
      )} */}
    </Stack>
  );
}
