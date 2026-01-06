import { optimisticallySendMessage } from '@convex-dev/agent/react';
import { StopCircleRounded } from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import 'highlight.js/styles/github.css';
import { ChatForm, chatFormOpts } from '~/components/ChatForm';
import { useAppForm } from '~/hooks/form';

export function StreamingSendMessage({
  threadId,
  isStreaming,
  abortStream,
}: {
  threadId: string;
  isStreaming: boolean;
  abortStream: () => void;
}) {
  const sendMessage = useMutation(
    api.agent.streaming.initiateAsyncStreaming
  ).withOptimisticUpdate(
    // optimisticallySendMessage(api.chat.streaming.listThreadMessages)
    optimisticallySendMessage(api.agent.streaming.listThreadMessages)
  );

  const form = useAppForm({
    ...chatFormOpts,
    onSubmit: async ({ value, formApi }) => {
      await sendMessage({ threadId, prompt: value.message });

      formApi.reset({ message: '' });
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
      <ChatForm
        form={form}
        actions={
          isStreaming ? (
            <Tooltip title='abort'>
              <IconButton onClick={abortStream} size='medium'>
                <StopCircleRounded fontSize='inherit' />
              </IconButton>
            </Tooltip>
          ) : null
        }
      />
    </Box>
  );
}
