import { optimisticallySendMessage } from '@convex-dev/agent/react';
import { Box } from '@mui/material';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import 'highlight.js/styles/github.css';
import { ChatForm, chatFormOpts } from '~/components/ChatForm';
import { useAppForm } from '~/hooks/form';

export function StreamingSendMessage({ threadId }: { threadId: string }) {
  // const { mutate: sendMessage, isPending } = useMutation({
  //   mutationFn: useConvexMutation(api.agent.streaming.initiateAsyncStreaming),
  //   onSuccess: (res) => {
  //     console.log('mutation finished', res);
  //   },
  // });
  const sendMessage = useMutation(
    api.agent.streaming.initiateAsyncStreaming
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.chat.streaming.listThreadMessages)
  );

  const form = useAppForm({
    ...chatFormOpts,
    onSubmit: async ({ value, formApi }) => {
      await sendMessage({ threadId, prompt: value.message });
      console.log('resetting form...');
      formApi.reset({ message: '' });
      // form.reset();
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
