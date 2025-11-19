import { Box, Slider, styled, Typography } from '@mui/material';
import { formatDuration } from '~/utils/format';

const TinyText = styled(Typography)({
  fontSize: '0.75rem',
  opacity: 0.38,
  fontWeight: 500,
  letterSpacing: 0.2,
});

interface ProgressSliderProps {
  position: number;
  duration: number;
  seek: (val: number) => void;
}

export function ProgressSlider({
  position,
  duration,
  seek,
}: ProgressSliderProps) {
  return (
    <>
      <Slider
        aria-label='time-indicator'
        size='small'
        value={position}
        min={0}
        max={duration || 1}
        step={1}
        onChange={(_, val) => seek(val)}
        sx={(t) => ({
          color: 'rgba(0,0,0,0.87)',
          height: 4,
          '& .MuiSlider-thumb': {
            width: 8,
            height: 8,
            transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
            '&::before': {
              boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
            },
            '&:hover, &.Mui-focusVisible': {
              boxShadow: `0px 0px 0px 8px ${'rgb(0 0 0 / 16%)'}`,
              ...t.applyStyles('dark', {
                boxShadow: `0px 0px 0px 8px ${'rgb(255 255 255 / 16%)'}`,
              }),
            },
            '&.Mui-active': {
              width: 20,
              height: 20,
            },
          },
          '& .MuiSlider-rail': {
            opacity: 0.28,
          },
          ...t.applyStyles('dark', {
            color: '#fff',
          }),
        })}
      />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: -2,
        }}
      >
        <TinyText>{formatDuration(position)}</TinyText>
        <TinyText>-{formatDuration(duration - position)}</TinyText>
      </Box>
    </>
  );
}
