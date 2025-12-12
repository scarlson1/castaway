import { optimisticallySendMessage } from '@convex-dev/agent/react';
import { Box } from '@mui/material';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import 'highlight.js/styles/github.css';
import { ChatForm, chatSchema } from '~/components/ChatForm';
import { useAppForm } from '~/hooks/form';

export function StreamingSendMessage({ threadId }: { threadId: string }) {
  const sendMessage = useMutation(
    api.agent.streaming.initiateAsyncStreaming
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.chat.streaming.listThreadMessages)
  );

  const form = useAppForm({
    // ...chatFormOpts,
    defaultValues: {
      message: '',
    },
    validators: {
      onChange: chatSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      await sendMessage({ threadId, prompt: value.message });

      // formApi.reset({ message: '' });
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
// actions={
//   <IconButton
//     size='small'
//     onClick={(e) => {
//       e.preventDefault();
//       e.stopPropagation();
//       const order =
//         messages.find((m) => m.status === 'streaming')?.order ?? 0;
//       void abortStreamByOrder({ threadId, order });
//     }}
//   >
//     <StopRounded fontSize='inherit' />
//   </IconButton>
// }
