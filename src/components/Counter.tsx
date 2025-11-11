import { Stack } from '@mui/material';
import { useSearch } from '@tanstack/react-router';
import { MuiButtonLink } from './MuiButtonLink';

export function Counter() {
  const { count = 0 } = useSearch({ from: '/' });

  return (
    <Stack>
      <MuiButtonLink
        variant='contained'
        size='large'
        to={'/'}
        search={{ count: count + 1 }}
      >
        Clicks: {count}
      </MuiButtonLink>
    </Stack>
  );
}
