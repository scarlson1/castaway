import {
  AddCircleRounded,
  Forward30,
  RemoveCircleRounded,
  Replay10,
  VolumeDown,
  VolumeUp,
} from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  Slider,
  Stack,
  styled,
  Typography,
} from '@mui/material';
import { useCallback, useRef, type RefObject } from 'react';
import { PlayPauseButton } from '~/components/PlayPauseButton';
import { useHover } from '~/hooks/useHover';
import { useHowler } from '~/hooks/useHowler';

const Widget = styled('div')(({ theme }) => ({
  padding: 16,
  // borderRadius: 16,
  // width: 343,
  maxWidth: '100%',
  margin: 'auto',
  position: 'relative',
  zIndex: theme.zIndex.drawer,
  backgroundColor: 'rgba(255,255,255,0.4)',
  backdropFilter: 'blur(16px)',
  ...theme.applyStyles('dark', {
    backgroundColor: 'rgba(0,0,0,0.4)',
  }),
}));

const CoverImage = styled('div')(({ theme }) => ({
  width: 80,
  [theme.breakpoints.up('sm')]: {
    width: 100,
  },
  height: 100,
  objectFit: 'cover',
  overflow: 'hidden',
  flexShrink: 0,
  borderRadius: 8,
  backgroundColor: 'rgba(0,0,0,0.08)',
  '& > img': {
    width: '100%',
  },
}));

const TinyText = styled(Typography)({
  fontSize: '0.75rem',
  opacity: 0.38,
  fontWeight: 500,
  letterSpacing: 0.2,
});

interface AudioPlayerProps {
  id: string;
  src: string;
  title: string;
  coverArt: string;
  podName: string;
  releaseDate: string;
}

export default function AudioPlayer({
  id,
  src,
  title,
  coverArt,
  podName,
  releaseDate,
}: AudioPlayerProps) {
  const {
    play,
    pause,
    mute,
    setVol,
    setRate,
    seek,
    isPlaying,
    duration,
    position,
    volume,
    rate,
  } = useHowler(src);

  return (
    <Widget
      sx={{
        display: 'flex',
      }}
    >
      <CoverImage>
        <img src={coverArt} alt={`${title} cover`} />
      </CoverImage>

      <PlaybackControls
        seek={seek}
        position={position}
        isPlaying={isPlaying}
        pause={pause}
        play={play}
      />

      <Box sx={{ flex: '1 1 auto', mx: 2 }}>
        <Typography
          variant='h6'
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          {title}
        </Typography>
        <Typography
          variant='body2'
          color='textSecondary'
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >{`${podName} - ${releaseDate}`}</Typography>

        <ProgressSlider position={position} duration={duration} seek={seek} />
      </Box>
      <Box>
        <RateButtons rate={rate()} setRate={setRate} />
      </Box>
      <Box
        sx={{
          flex: '0 1 200px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <VolumeControl volume={volume} setVol={setVol} />
      </Box>
    </Widget>
  );
}

interface PlaybackControls {
  seek: (t: number) => void;
  position: number;
  isPlaying: boolean;
  pause: () => void;
  play: () => void;
}
function PlaybackControls({ seek, position, isPlaying, pause, play }) {
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& svg': {
          color: '#000',
          ...theme.applyStyles('dark', {
            color: '#fff',
          }),
        },
      })}
    >
      <IconButton
        aria-label='previous song'
        onClick={() => seek(position - 10)}
        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
      >
        <Replay10 fontSize='inherit' />
      </IconButton>
      <PlayPauseButton isPlaying={isPlaying} onToggle={handlePlayPause} />
      <IconButton
        aria-label='skip 30 seconds'
        onClick={() => seek(position + 30)}
        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
      >
        <Forward30 fontSize='inherit' />
      </IconButton>
    </Box>
  );
}

function formatDuration(value: number) {
  const minute = Math.floor(value / 60);
  const secondLeft = Math.floor(value - minute * 60);
  return `${minute}:${secondLeft < 10 ? `0${secondLeft}` : secondLeft}`;
}

interface ProgressSliderProps {
  position: number;
  duration: number;
  seek: (val: number) => void;
}

function ProgressSlider({ position, duration, seek }: ProgressSliderProps) {
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

function RateButtons({
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

interface VolumeControlProps {
  volume: number;
  setVol: (val: number) => void;
}
function VolumeControl({ volume, setVol }: VolumeControlProps) {
  return (
    <Stack
      spacing={2}
      direction='row'
      sx={(theme) => ({
        mb: 1,
        px: 1,
        '& > svg': {
          color: 'rgba(0,0,0,0.4)',
          ...theme.applyStyles('dark', {
            color: 'rgba(255,255,255,0.4)',
          }),
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
  );
}

// import { useEffect, useRef, useState } from 'react';
// import { useOfflineAudio } from '../hooks/useOfflineAudio';

// interface AudioPlayerProps {
//   id: string;
//   src: string;
//   title: string;
// }

// export default function AudioPlayer({ id, src, title }: AudioPlayerProps) {
//   const audioRef = useRef<HTMLAudioElement>(null);
//   const [playing, setPlaying] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [localSrc, setLocalSrc] = useState(src);
//   const [isOffline, setIsOffline] = useState(false);
//   const { downloadEpisode, getCachedEpisodeUrl, isDownloaded } =
//     useOfflineAudio();

//   // Load saved playback position
//   useEffect(() => {
//     const savedProgress = localStorage.getItem(`progress-${id}`);
//     if (savedProgress) setProgress(parseFloat(savedProgress));
//   }, [id]);

//   // Try loading offline copy if available
//   useEffect(() => {
//     (async () => {
//       const cachedUrl = await getCachedEpisodeUrl(id);
//       if (cachedUrl) {
//         setLocalSrc(cachedUrl);
//         setIsOffline(true);
//       }
//     })();
//   }, [id]);

//   // Restore position when metadata loads
//   const handleLoadedMetadata = () => {
//     if (audioRef.current && progress > 0) {
//       audioRef.current.currentTime = progress;
//     }
//   };

//   // Save progress periodically
//   const handleTimeUpdate = () => {
//     const currentTime = audioRef.current?.currentTime || 0;
//     localStorage.setItem(`progress-${id}`, currentTime.toString());
//   };

//   const togglePlay = () => {
//     if (!audioRef.current) return;
//     if (playing) audioRef.current.pause();
//     else audioRef.current.play();
//     setPlaying(!playing);
//   };

//   const handleDownload = async () => {
//     await downloadEpisode(id, src);
//     alert('Episode downloaded for offline playback!');
//   };

//   return (
//     <div className='p-4 rounded-2xl bg-gray-800 text-white w-full max-w-md mx-auto'>
//       <h2 className='text-lg font-semibold mb-2'>{title}</h2>
//       <audio
//         ref={audioRef}
//         src={localSrc}
//         onLoadedMetadata={handleLoadedMetadata}
//         onTimeUpdate={handleTimeUpdate}
//         controls
//         preload='metadata'
//         className='w-full'
//       />
//       <div className='flex gap-2 mt-2'>
//         <button
//           onClick={togglePlay}
//           className='bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl'
//         >
//           {playing ? 'Pause' : 'Play'}
//         </button>
//         {!isOffline && (
//           <button
//             onClick={handleDownload}
//             className='bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl'
//           >
//             Download
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }
