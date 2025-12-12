import { useConvexMutation } from '@convex-dev/react-query';
import { Box, Container, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { ChatForm, chatFormOpts } from '~/components/ChatForm';
import { useAppForm } from '~/hooks/form';

// display chat input --> when user submits --> create thread with initial prompt --> navigate to /chat/$threadId

export const Route = createFileRoute('/_authed/chat/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { mutate: createThread, isPending } = useMutation({
    mutationFn: useConvexMutation(api.agent.threads.create),
    // onMutate: () => toast.loading(`checking for new episodes`),
    onSuccess: ({ threadId }) => {
      navigate({ to: '$threadId', params: { threadId } });
    },
    // onError: () => toast.error('something went wrong'),
  });

  const form = useAppForm({
    ...chatFormOpts,
    onSubmit: async ({ value, formApi }) => {
      await createThread({
        initialMessage: { role: 'user', content: value.message },
      });

      formApi.reset({ message: '' });
    },
  });

  return (
    <Container
      maxWidth='md'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
      }}
    >
      <Typography variant='h4' sx={{ pb: 4 }}>
        What are you working on?
      </Typography>

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
        <ChatForm form={form} actions={null} />
      </Box>
    </Container>
  );
}
