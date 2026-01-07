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
import { useInView } from 'react-intersection-observer';
import { Message } from '~/components/Chat/Message';
import { useEventListener } from '~/hooks/useEventListener';

const SCROLL_THRESHOLD = 50; // px from bottom to still count as "at bottom"

export function MessageList({
  messages,
  loadMore,
  status,
  threadId,
}: {
  messages: UIMessage[];
  loadMore: (numItems: number) => void;
  status: UsePaginatedQueryResult<UIMessage>['status']; // UsePaginatedQueryResult<UIMessagesQueryResult<Query>> // string;
  threadId: string;
  // isLoading
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastMessageKeyRef = useRef<string | null>(null);
  const firstMessageKeyRef = useRef<string | null>(null);
  const previousScrollHeightRef = useRef<number>(0);
  const isLoadingMoreRef = useRef(false);
  const hasInitialScrolledRef = useRef(false);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const { ref, inView } = useInView();

  // useEffect(() => {
  //   console.log(import.meta.env);
  //   if (import.meta.env.DEV) console.log('messages:', messages);
  // }, [messages]);

  // Reset initial scroll flag when thread changes
  useEffect(() => {
    hasInitialScrolledRef.current = false;
  }, [threadId]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (
      !hasInitialScrolledRef.current &&
      status !== 'LoadingFirstPage' &&
      messages.length > 0
    ) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
        hasInitialScrolledRef.current = true;
        setIsAtBottom(true);
      });
    }
  }, [status, messages.length, threadId]);

  useEffect(() => {
    //   if (inView && status === 'CanLoadMore') loadMore(4);
    if (inView && status === 'CanLoadMore') {
      const el = containerRef.current;
      if (el) {
        previousScrollHeightRef.current = el.scrollHeight;
      }
      isLoadingMoreRef.current = true;
      loadMore(4);
    }
  }, [inView, loadMore, status]);

  // Preserve scroll position when loading more (messages added at beginning)
  useEffect(() => {
    if (messages.length === 0) {
      firstMessageKeyRef.current = null;
      lastMessageKeyRef.current = null;
      return;
    }

    const firstMessage = messages[0];
    const firstMessageKey = firstMessage?.key;
    const lastMessage = messages[messages.length - 1];
    const lastMessageKey = lastMessage?.key;

    // Check if messages were added at the beginning (loadMore scenario)
    // This happens when the first message key changes
    const messagesAddedAtBeginning =
      firstMessageKeyRef.current !== null &&
      firstMessageKey !== null &&
      firstMessageKey !== firstMessageKeyRef.current;

    // Check if a new message was added at the end (new message scenario)
    // This happens when the last message key changes, but the previous last message
    // is still the second-to-last message (meaning a new one was appended)
    const isNewMessageAtEnd =
      lastMessageKeyRef.current !== null &&
      lastMessageKey !== null &&
      lastMessageKey !== lastMessageKeyRef.current &&
      (messages.length === 1 ||
        lastMessageKeyRef.current === messages[messages.length - 2]?.key);

    // If messages were added at beginning, preserve scroll position
    if (messagesAddedAtBeginning && isLoadingMoreRef.current) {
      const el = containerRef.current;
      if (el && previousScrollHeightRef.current > 0) {
        const scrollDiff = el.scrollHeight - previousScrollHeightRef.current;
        el.scrollTop += scrollDiff;
        previousScrollHeightRef.current = 0;
        isLoadingMoreRef.current = false;
      }
    }

    firstMessageKeyRef.current = firstMessageKey;
    lastMessageKeyRef.current = lastMessageKey;

    // Only auto-scroll if:
    // 1. User is at bottom AND
    // 2. A new message was added at the end (not loading more)
    if (isAtBottom && isNewMessageAtEnd && !isLoadingMoreRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  const onScroll = useCallback((e: Event) => {
    const el = e.target as HTMLElement;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsAtBottom(distanceFromBottom < SCROLL_THRESHOLD);
  }, []);

  useEventListener(
    'scroll',
    onScroll,
    containerRef as RefObject<HTMLDivElement>
  );

  return (
    <Stack ref={containerRef} spacing={2} sx={{ overflowY: 'auto', flex: 1 }}>
      {status === 'LoadingFirstPage' ? (
        <CircularProgress size={20} sx={{ alignSelf: 'center' }} />
      ) : //  Messages area - scrollable
      messages.length > 0 ? (
        <>
          {status === 'CanLoadMore' || status === 'LoadingMore' ? (
            <Button
              ref={ref}
              onClick={() => loadMore(4)}
              loading={status === 'LoadingMore'}
            >
              Load more
            </Button>
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
    </Stack>
  );
}
