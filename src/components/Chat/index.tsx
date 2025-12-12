import { useConvexMutation } from '@convex-dev/react-query';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import 'highlight.js/styles/github.css';
import { Suspense, useCallback, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { MessageList } from '~/components/Chat/MessageList';
import { SendMessage } from '~/components/Chat/SendMessage';
import { StreamingSendMessage } from '~/components/Chat/StreamingSendMessage';

export const Chat = () => {
  const [threadId, setThreadId] = useState();
  const { mutate: createThread, isPending } = useMutation({
    mutationFn: useConvexMutation(api.agent.threads.create),
    // onMutate: () => toast.loading(`checking for new episodes`),
    onSuccess: ({ threadId: id }) => {
      setThreadId(id);
    },
    // onError: () => toast.error('something went wrong'),
  });

  const [streaming, setStreaming] = useState(true);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setStreaming(event.target.checked);
    },
    []
  );

  return (
    <Container disableGutters maxWidth='md'>
      <Stack
        spacing={2}
        direction='row'
        sx={{ justifyContent: 'space-between' }}
      >
        <Typography variant='h5' fontWeight='medium' gutterBottom>
          Convex Agent Chat
        </Typography>
        <FormControlLabel
          control={<Switch checked={streaming} onChange={handleChange} />}
          label='Streaming'
        />
      </Stack>

      {threadId ? (
        <ChatFlexLayout threadId={threadId} streaming={streaming} />
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

function ChatFlexLayout({
  threadId,
  streaming,
}: {
  threadId: string;
  streaming: boolean;
}) {
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
            <MessageList threadId={threadId} stream={streaming} />
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
        {streaming ? (
          <ErrorBoundary
            fallback={<Typography color='error'>Error loading form</Typography>}
          >
            <Suspense>
              <StreamingSendMessage threadId={threadId} />
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
    </Box>
  );
}

// function ChatAbsoluteLayout({ threadId }: { threadId: string }) {
//   return (
//     <Box
//       sx={{
//         position: 'relative',
//         height: '100vh',
//       }}
//     >
//       <Box>
//         <ErrorBoundary
//           fallback={
//             <Typography color='error'>Error displaying thread</Typography>
//           }
//         >
//           <Suspense fallback={<CircularProgress />}>
//             <MessageList threadId={threadId} />
//           </Suspense>
//         </ErrorBoundary>
//       </Box>
//       <Box
//         sx={{
//           position: 'absolute',
//           bottom: 0,
//           left: 0,
//           width: '100%',
//         }}
//       >
//         <ErrorBoundary
//           fallback={<Typography color='error'>Error loading form</Typography>}
//         >
//           <Suspense>
//             <SendMessage threadId={threadId} />
//           </Suspense>
//         </ErrorBoundary>
//       </Box>
//     </Box>
//   );
// }
