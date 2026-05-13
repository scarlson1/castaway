import { useConvexMutation } from '@convex-dev/react-query';
import { ArrowForwardRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useState } from 'react';

export const Route = createFileRoute('/_authed/chat/')({
  component: RouteComponent,
});

const SUGGESTED = [
  'What was the last episode I listened to?',
  'Find me episodes about AI',
  'What podcasts cover climate change?',
  'Summarize recent episodes from my subscriptions',
];

function RouteComponent() {
  const navigate = Route.useNavigate();
  const [message, setMessage] = useState('');

  const { mutate: createThread, isPending } = useMutation({
    mutationFn: useConvexMutation(api.agent.threads.create),
    onSuccess: ({ threadId }) => {
      navigate({ to: '$threadId', params: { threadId } });
    },
  });

  const handleSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    createThread({ initialMessage: { role: 'user', content: trimmed } });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Centered empty state */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, sm: 6 },
          pb: 4,
          gap: 1,
        }}
      >
        <Typography
          variant='h4'
          sx={{ letterSpacing: '-0.03em', mb: 0.5 }}
        >
          Ask.
        </Typography>
        <Typography variant='body2' color='textSecondary' sx={{ mb: 3 }}>
          Search and explore your podcast library
        </Typography>

        <Stack
          direction='row'
          sx={{ flexWrap: 'wrap', justifyContent: 'center', gap: 0.75, maxWidth: 480 }}
        >
          {SUGGESTED.map((s) => (
            <Chip
              key={s}
              label={s}
              size='small'
              onClick={() => handleSubmit(s)}
              sx={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                height: 'auto',
                py: 0.5,
                borderRadius: 0.5,
                bgcolor: 'action.selected',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Input row */}
      <Box
        component='form'
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(message);
        }}
        sx={[
          {
            flexShrink: 0,
            borderTop: '1px solid',
            borderColor: 'divider',
            p: 1.5,
            display: 'flex',
            gap: 1,
            alignItems: 'flex-end',
            bgcolor: 'background.paper',
          },
        ]}
      >
        <TextField
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder='Ask your library...'
          multiline
          maxRows={4}
          fullWidth
          size='small'
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(message);
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: 13,
              bgcolor: 'background.default',
              borderRadius: 0.75,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'divider',
            },
          }}
        />
        <Button
          type='submit'
          variant='contained'
          disabled={!message.trim() || isPending}
          loading={isPending}
          endIcon={<ArrowForwardRounded fontSize='small' />}
          sx={{
            flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            px: 1.75,
            py: 0.875,
            borderRadius: 0.75,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          Ask
        </Button>
      </Box>
    </Box>
  );
}
