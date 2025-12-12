import type { UIMessage } from '@convex-dev/agent';
import { toUIMessages, useThreadMessages } from '@convex-dev/agent/react';
import { useConvexAction, useConvexMutation } from '@convex-dev/react-query';
import {
  CheckRounded,
  ContentCopyRounded,
  CopyAllRounded,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Stack,
  styled,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { Suspense, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
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
    <Container disableGutters maxWidth='md'>
      <Typography variant='h5' fontWeight='medium' gutterBottom>
        Convex Agent Chat
      </Typography>
      {threadId ? (
        <ChatFlexLayout threadId={threadId} />
      ) : (
        // <Stack spacing={2}>
        //   <ErrorBoundary
        //     fallback={
        //       <Typography color='error'>Error displaying thread</Typography>
        //     }
        //   >
        //     <Suspense fallback={<CircularProgress />}>
        //       <MessageList threadId={threadId} />
        //     </Suspense>
        //   </ErrorBoundary>
        //   <ErrorBoundary
        //     fallback={<Typography color='error'>Error loading form</Typography>}
        //   >
        //     <Suspense>
        //       <SendMessage threadId={threadId} />
        //     </Suspense>
        //   </ErrorBoundary>
        // </Stack>
        <Stack spacing={2}>
          <Typography>No thread created yet</Typography>
          <Button onClick={() => createThread({})}>Create thread</Button>
        </Stack>
      )}
    </Container>
  );
};

function ChatFlexLayout({ threadId }: { threadId: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <Box
        sx={{
          flex: 1,
        }}
      >
        <ErrorBoundary
          fallback={
            <Typography color='error'>Error displaying thread</Typography>
          }
        >
          <Suspense fallback={<CircularProgress />}>
            <MessageList threadId={threadId} />
          </Suspense>
        </ErrorBoundary>
      </Box>
      <Box
        sx={{
          // p: 2,
          pt: 2,
          pb: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          bottom: 0, // 20,
          display: 'flex',
          gap: 1,
          bgcolor: 'background.default',
        }}
      >
        <ErrorBoundary
          fallback={<Typography color='error'>Error loading form</Typography>}
        >
          <Suspense>
            <SendMessage threadId={threadId} />
          </Suspense>
        </ErrorBoundary>
      </Box>
    </Box>
  );
}

function ChatAbsoluteLayout({ threadId }: { threadId: string }) {
  return (
    <Box
      sx={{
        position: 'relative',
        height: '100vh',
      }}
    >
      <Box>
        <ErrorBoundary
          fallback={
            <Typography color='error'>Error displaying thread</Typography>
          }
        >
          <Suspense fallback={<CircularProgress />}>
            <MessageList threadId={threadId} />
          </Suspense>
        </ErrorBoundary>
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
        }}
      >
        <ErrorBoundary
          fallback={<Typography color='error'>Error loading form</Typography>}
        >
          <Suspense>
            <SendMessage threadId={threadId} />
          </Suspense>
        </ErrorBoundary>
      </Box>
    </Box>
  );
}

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

  const messageEndRef = useRef<HTMLDivElement | null>(null);
  // Auto-scroll on new message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [results]);

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
    <Stack spacing={2} sx={{ overflowY: 'auto', flex: 1 }}>
      {results?.length > 0
        ? toUIMessages(results ?? []).map((m) => (
            <Message key={m.key} message={m} />
          ))
        : null}
      {/* {results.map((msg, i) => (
        <Message key={msg.key} message={msg} />
      ))} */}
      <div ref={messageEndRef} />
    </Stack>
  );
}

function Message({ message }: { message: UIMessage }) {
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
          {/* <Typography>{message.text || '...'}</Typography> */}
          <ChatMarkdown content={message.text || '...'} />
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

const ChatMarkdownStyledWrapper = styled(Box)(({ theme }) => ({
  '& p': {
    color: theme.vars.palette.text.primary, // 'text.primary',
    lineHeight: 1.7,
    margin: '0.5em 0',
  },
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    color: theme.vars.palette.text.primary,
    fontWeight: 600,
    marginTop: '1.4em',
    marginBottom: '0.6em',
  },
  '& a': {
    color: theme.vars.palette.primary.main,
    textDecoration: 'underline',
  },
  '& ul, & ol': {
    paddingLeft: '1.5em',
    margin: '0.8em 0',
  },
  '& pre': {
    overflowX: 'auto',
    whiteSpace: 'pre-wrap' /* wraps long lines */,
    wordBreak: 'break-word',
    backgroundColor: theme.vars.palette.background.paper, //  'background.paper',
    padding: theme.spacing(2), // 2,
    borderRadius: theme.spacing(2), // 2,
    fontSize: '0.875rem',
  },
  '& code': {
    whiteSpace: 'pre-wrap',
    backgroundColor: theme.vars.palette.action.hover, // 'action.hover',
    borderRadius: '4px',
    padding: '2px 4px',
    fontSize: '0.875em',
  },
}));

// const components: Components = {
//   // @ts-ignore
//   code({ node, inline, className, children, ...props }) {
//     if (inline)
//       return (
//         <code className={className} {...props}>
//           {children}
//         </code>
//       );
//     return <CodeBlock>{children}</CodeBlock>;
//   },
// };

function extractText(node: any): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node?.props?.children) return extractText(node.props.children);
  return '';
}

const markdownComponents = {
  code({ inline, className, children, ...props }: any) {
    const isInline =
      props.node?.tagName === 'code' && props.parent?.tagName !== 'pre';

    const rawText = extractText(children);
    const language = className?.replace('language-', '') || undefined;

    // if (inline) {
    if (isInline) {
      return (
        <code
          style={{
            background: 'rgba(0,0,0,0.12)',
            padding: '2px 4px',
            borderRadius: '4px',
            fontFamily: 'monospace',
          }}
          className={className}
          inline={true}
          {...props}
        >
          {rawText}
        </code>
      );
    }

    return <ChatCodeBlock code={rawText} language={language} />;
  },
};

function ChatMarkdown({ content }: { content: string }) {
  return (
    <ChatMarkdownStyledWrapper className='prose prose-neutral dark:prose-invert max-w-none'>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        // components={components}
        components={markdownComponents}
      >
        {content}
      </Markdown>
    </ChatMarkdownStyledWrapper>
  );
}

function CodeBlock({ children }) {
  const text = String(children).trim();

  const copy = () => navigator.clipboard.writeText(text);

  return (
    <Box sx={{ position: 'relative' }}>
      <IconButton
        size='small'
        onClick={copy}
        sx={{ position: 'absolute', right: 4, top: 2 }}
      >
        <CopyAllRounded fontSize='inherit' />
      </IconButton>
      <pre>
        <code>{text}</code>
      </pre>
    </Box>
  );
}

interface ChatCodeBlockProps {
  code: string;
  language?: string;
}

function ChatCodeBlock({ code, language }: ChatCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const highlighted = language
    ? hljs.highlight(code, { language }).value
    : hljs.highlightAuto(code).value;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        mt: 1,
        mb: 1,
      }}
    >
      {/* Copy Button */}
      <Box sx={{ position: 'absolute', top: 6, right: 6, zIndex: 10 }}>
        <Tooltip title={copied ? 'Copied!' : 'Copy'}>
          <IconButton
            size='small'
            onClick={handleCopy}
            sx={{
              bgcolor: 'background.default',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {copied ? (
              <CheckRounded fontSize='small' />
            ) : (
              <ContentCopyRounded fontSize='small' />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Code Container */}
      <Box
        component='pre'
        sx={{
          m: 0,
          p: 2,
          overflowX: 'auto',
          whiteSpace: 'pre',
          fontSize: '0.9rem',
          lineHeight: 1.6,
        }}
      >
        <code
          dangerouslySetInnerHTML={{ __html: highlighted }}
          style={{ fontFamily: 'monospace' }}
        />
      </Box>
    </Box>
  );
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
    onSubmit: async ({ value, formApi }) => {
      await sendMessage({ threadId, prompt: value.message });
      console.log('resetting form...');
      // formApi.clearFieldValues()
      formApi.reset({ message: '' });

      formApi.resetField('message');
      formApi.setFieldValue('message', '');
      form.reset();
    },
  });

  return (
    <Box
      component='form'
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      noValidate
      autoComplete='off'
      // autocomplete="off"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        gap: 2,
      }}
    >
      <ChatForm form={form} />
    </Box>
  );
}
