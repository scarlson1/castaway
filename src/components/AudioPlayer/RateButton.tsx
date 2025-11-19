import { AddCircleRounded, RemoveCircleRounded } from '@mui/icons-material';
import { Button, IconButton, Stack } from '@mui/material';
import { useCallback, useRef, type RefObject } from 'react';
import { useHover } from '~/hooks/useHover';

// TODO: fix not rerendering after incrementing rate (store in state instead of howler.rate() method)

export function RateButtons({
  rate,
  setRate,
}: {
  rate: number;
  setRate: (val: number) => void;
}) {
  let ref = useRef<HTMLDivElement>(null);
  let [isHovering] = useHover(ref as RefObject<HTMLDivElement>);

  const handleSetRate = useCallback(() => {
    let newRate = rate < 1 || rate > 1.5 ? 1 : rate <= 1 ? 1.5 : 2;
    setRate(newRate);
  }, [rate]);

  const handleIncrement = useCallback(
    (amt: number) => {
      setRate(Math.round((rate + amt) * 10) / 10);
    },
    [rate]
  );

  if (!rate) return null;

  return (
    <Stack ref={ref} sx={{ alignItems: 'center' }}>
      <IconButton
        size='small'
        sx={{ opacity: isHovering ? 1 : 0 }}
        onClick={() => handleIncrement(0.1)}
      >
        <AddCircleRounded fontSize='inherit' />
      </IconButton>
      <Button
        color='inherit'
        variant='outlined'
        size='small'
        onClick={() => handleSetRate()}
        sx={{ minWidth: 48 }}
      >{`${rate}x`}</Button>
      <IconButton
        size='small'
        sx={{ opacity: isHovering ? 1 : 0 }}
        onClick={() => handleIncrement(-0.1)}
      >
        <RemoveCircleRounded fontSize='inherit' />
      </IconButton>
    </Stack>
  );
}
