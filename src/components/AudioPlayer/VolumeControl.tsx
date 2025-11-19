import { VolumeDown, VolumeUp } from '@mui/icons-material';
import { Slider, Stack } from '@mui/material';

interface VolumeControlProps {
  volume: number;
  setVol: (val: number) => void;
}

export function VolumeControl({ volume, setVol }: VolumeControlProps) {
  // TODO: icon button slider for small screens
  return (
    <>
      <Stack
        spacing={2}
        direction={{ xs: 'column', sm: 'row' }}
        sx={(theme) => ({
          mb: 1,
          px: 1,
          '& > svg': {
            color: 'rgba(0,0,0,0.4)',
            ...theme.applyStyles('dark', {
              color: 'rgba(255,255,255,0.4)',
            }),
          },
          display: {
            xs: 'none',
            md: 'flex',
          },
        })}
        alignItems='center'
      >
        <VolumeDown />
        <Slider
          aria-label='Volume'
          value={volume}
          min={0}
          max={1}
          step={0.05}
          onChange={(_, val) => setVol(val)}
          // sx={{ color: 'white' }}
          sx={(t) => ({
            color: 'rgba(0,0,0,0.87)',
            '& .MuiSlider-track': {
              border: 'none',
            },
            '& .MuiSlider-thumb': {
              width: 24,
              height: 24,
              backgroundColor: '#fff',
              '&::before': {
                boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
              },
              '&:hover, &.Mui-focusVisible, &.Mui-active': {
                boxShadow: 'none',
              },
            },
            ...t.applyStyles('dark', {
              color: '#fff',
            }),
          })}
        />
        <VolumeUp />
      </Stack>
    </>
  );
}
