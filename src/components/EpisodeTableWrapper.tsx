import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function EpisodesTableWrapper({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={[
        {
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.25,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        },
      ]}
    >
      {/* <Box sx={{ px: { xs: 1, sm: 2 } }}> */}
      {/* Table header */}
      <Box
        sx={[
          {
            display: { xs: 'none', sm: 'grid' },
            gridTemplateColumns: '64px 1fr 100px 80px 36px',
            gap: 1.75,
            alignItems: 'center',
            px: 2,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: '#f4f3ee',
          },
          (t) => t.applyStyles('dark', { bgcolor: '#1a1813' }),
        ]}
      >
        {['#', 'Episode', 'Released', 'Length', ''].map((h, i) => (
          <Typography
            key={i}
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            {h}
          </Typography>
        ))}
      </Box>
      {children}
      {/* </Box> */}
    </Box>
  );
}
