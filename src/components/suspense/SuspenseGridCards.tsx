import { Grid, type GridProps } from '@mui/material';
import { useId } from 'react';
import { SuspenseCard } from '~/components/suspense/SuspenseCard';

interface SuspenseGridCardsProps extends GridProps {
  numItems: number;
  orientation?: string;
  rank?: string | boolean;
  childGridProps?: GridProps;
}

export const SuspenseGridCards = ({
  numItems,
  orientation = 'vertical',
  rank,
  childGridProps,
  ...props
}: SuspenseGridCardsProps) => {
  const id = useId();
  const data = Array.from(
    { length: numItems },
    (_, k) => `${id}-grid-card-item-${k}`
  );

  return (
    <Grid container spacing={2} columns={16} {...props}>
      {data.map((pod) => (
        <Grid
          size={{ xs: 8, sm: 4, md: 4, lg: 2 }}
          {...childGridProps}
          key={pod}
        >
          <SuspenseCard orientation={orientation} rank={rank}>
            {/* <Skeleton variant='circular'>
              <IconButton size='small' sx={{ minWidth: 24 }} />
            </Skeleton> */}
          </SuspenseCard>
        </Grid>
      ))}
    </Grid>
  );
};
