import { useConvexAction } from '@convex-dev/react-query';
import { Box } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import 'highlight.js/styles/github.css';
import { ChatForm, chatFormOpts } from '~/components/ChatForm';
import { useAppForm } from '~/hooks/form';

export function SendMessage({ threadId }: { threadId: string }) {
  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: useConvexAction(api.agent.chat.sendMessageToAgent),
    onSuccess: (res) => {
      console.log('mutation finished', res);
    },
  });

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
      {/* <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('resetting form');
          form.reset();
        }}
      >
        reset
      </button> */}
    </Box>
  );
}
