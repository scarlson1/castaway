import { Card, CardContent, CardMedia, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import { trendingQueryOptions } from '~/queries';

export function CategoryCard({
  title,
  category,
  color,
}: {
  title: string;
  category: string | number;
  color: string;
}) {
  const navigate = useNavigate();
  const { data } = useQuery(
    trendingQueryOptions({ cat: category, lang: 'en', max: 2 })
  );
  const top = data?.feeds?.[0];

  const handleSelect = useCallback(
    (cat: string | number) => {
      navigate({ to: '/trending', search: { cat, max: 100, lang: 'en' } });
    },
    [navigate]
  );

  return (
    <Card
      sx={{
        width: '100%',
        // backgroundColor: 'primary.main',
        position: 'relative',
        height: 160,
        borderRadius: 2,
        backgroundColor: color,
        overflow: 'hidden',
        cursor: 'pointer',
        '&:hover': { transform: 'scale(1.02)' },
        transition: '0.25s',
      }}
      onClick={() => handleSelect(category)}
    >
      <CardContent>
        <Typography variant='h5'>{title}</Typography>
      </CardContent>
      {top?.artwork ? (
        <CardMedia
          component='img'
          image={top?.artwork}
          alt={title}
          sx={{
            position: 'absolute',
            bottom: -10,
            right: -10,
            width: 120,
            height: 120,
            transform: 'rotate(15deg)',
            borderRadius: 2,
            boxShadow: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
          }}
        />
      ) : null}
    </Card>
  );
}
