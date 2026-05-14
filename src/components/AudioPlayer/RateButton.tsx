import { Box } from '@mui/material';
import { useCallback, useRef, type RefObject } from 'react';
import { useHover } from '~/hooks/useHover';

export function RateButtons({
  rate,
  setRate,
}: {
  rate: number;
  setRate: (val: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovering] = useHover(ref as RefObject<HTMLDivElement>);

  const handleCycle = useCallback(() => {
    const next = rate < 1 || rate > 1.5 ? 1 : rate <= 1 ? 1.5 : 2;
    setRate(next);
  }, [rate, setRate]);

  const handleIncrement = useCallback(
    (amt: number) => {
      let newRate = Math.round((rate + amt) * 10) / 10;
      if (newRate > 2) newRate = 2;
      if (newRate < 0.5) newRate = 0.5;
      setRate(newRate);
    },
    [rate, setRate],
  );

  if (!rate) return null;

  const btnSx = {
    opacity: isHovering ? 1 : 0,
    transition: 'opacity 0.15s',
    fontSize: 12,
    lineHeight: 1,
    cursor: 'pointer',
    color: 'text.secondary',
    px: 0.5,
    userSelect: 'none',
    '&:hover': { color: 'text.primary' },
  } as const;

  return (
    <Box
      ref={ref}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.25,
      }}
    >
      <Box role='button' onClick={() => handleIncrement(0.1)} sx={btnSx}>
        +
      </Box>
      <Box
        role='button'
        onClick={handleCycle}
        sx={{
          px: 1,
          py: 0.25,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 0.5,
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          cursor: 'pointer',
          color: 'text.secondary',
          flexShrink: 0,
          userSelect: 'none',
          '&:hover': { borderColor: 'text.secondary' },
        }}
      >
        {rate}×
      </Box>
      <Box role='button' onClick={() => handleIncrement(-0.1)} sx={btnSx}>
        −
      </Box>
    </Box>
  );
}
