import { convexQuery } from '@convex-dev/react-query';
import { Box, Typography } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';
import { useMemo } from 'react';
import { MuiLink } from '~/components/MuiLink';

const LABELS = ["EDITOR'S PICK", 'NEW SHOW', 'TRENDING'] as const;

export const Featured = () => {
  const { data } = useSuspenseQuery(
    convexQuery(api.podcasts.recentlyUpdated, { limit: 3 }),
  );

  const items = useMemo(() => data.slice(0, 3), [data]);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 1.5,
      }}
    >
      {items.map((pod, i) => (
        <FeaturedCard key={pod._id} pod={pod} label={LABELS[i]} />
      ))}
    </Box>
  );
};

function FeaturedCard({ pod, label }: { pod: Doc<'podcasts'>; label: string }) {
  return (
    <MuiLink
      to='/podcasts/$podId'
      params={{ podId: pod.podcastId }}
      underline='none'
      sx={{
        position: 'relative',
        display: 'block',
        borderRadius: 1.5,
        overflow: 'hidden',
        aspectRatio: '4/3',
        bgcolor: '#111',
        cursor: 'pointer',
        '&:hover img': { transform: 'scale(1.04)' },
      }}
    >
      {/* Background image */}
      <Box
        component='img'
        src={pod.imageUrl || ''}
        alt={pod.title}
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.55,
          transition: 'transform 0.4s ease',
        }}
      />

      {/* Gradient overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%)',
        }}
      />

      {/* Content */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Label badge */}
        <Box>
          <Box
            component='span'
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: 99,
              px: 1,
              py: 0.375,
              display: 'inline-block',
            }}
          >
            {label}
          </Box>
        </Box>

        {/* Title + author */}
        <Box>
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 700,
              fontSize: { xs: 15, md: 17 },
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              mb: 0.5,
            }}
          >
            {pod.title}
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 12,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {pod.author}
          </Typography>
        </Box>
      </Box>
    </MuiLink>
  );
}
