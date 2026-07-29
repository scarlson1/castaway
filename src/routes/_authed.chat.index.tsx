import { useConvexMutation } from '@convex-dev/react-query';
import { ArrowForwardRounded } from '@mui/icons-material';
import {
  Box,
  Button,
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

type Scope = 'library' | 'all' | 'this';

const SCOPES: { value: Scope; label: string }[] = [
  { value: 'library', label: 'Library' },
  { value: 'all', label: 'All shows' },
  { value: 'this', label: 'This show' },
];

function RouteComponent() {
  const navigate = Route.useNavigate();
  const [message, setMessage] = useState('');
  const [scope, setScope] = useState<Scope>('library');

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
        <Typography variant='body2' color='textSecondary' sx={{ mb: 0 }}>
          Search across every transcript in your library
        </Typography>
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
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {SCOPES.map(({ value, label }) => (
              <Box
                key={value}
                role='button'
                onClick={() => setScope(value)}
                sx={[
                  {
                    px: 1,
                    py: 0.25,
                    borderRadius: 99,
                    fontSize: 10,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    userSelect: 'none',
                    border: '1px solid',
                    transition: 'all 0.1s',
                  },
                  scope === value
                    ? {
                        bgcolor: 'text.primary',
                        color: 'background.default',
                        borderColor: 'text.primary',
                      }
                    : {
                        bgcolor: 'transparent',
                        color: 'text.secondary',
                        borderColor: 'divider',
                        '&:hover': { borderColor: 'text.secondary', color: 'text.primary' },
                      },
                ]}
              >
                {label}
              </Box>
            ))}
          </Box>
          <TextField
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Ask anything across your transcripts...'
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
        </Box>
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
            alignSelf: 'flex-end',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          Ask
        </Button>
      </Box>
    </Box>
  );
}
