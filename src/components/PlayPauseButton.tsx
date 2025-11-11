import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { IconButton } from '@mui/material';
import { motion } from 'motion/react';

export function PlayPauseButton({ isPlaying, onToggle }) {
  return (
    <IconButton
      onClick={onToggle}
      size='medium'
      sx={{
        // width: 64,
        // height: 64,
        height: 40,
        width: 40,
        fontSize: '1.4rem',
        bgcolor: 'primary.main',
        color: 'white',
        borderRadius: '50%',
        boxShadow: 3,
        '&:hover': { bgcolor: 'primary.dark' },
      }}
    >
      <motion.div
        key={isPlaying ? 'pause' : 'play'}
        initial={{ scale: 0.7, rotate: isPlaying ? 90 : -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0.7, rotate: isPlaying ? -90 : 90, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{ display: 'flex' }}
      >
        {isPlaying ? (
          // <PauseIcon sx={{ fontSize: 36 }} />
          <PauseIcon fontSize='inherit' />
        ) : (
          // <PlayArrowIcon sx={{ fontSize: 36 }} />
          <PlayArrowIcon fontSize='inherit' />
        )}
      </motion.div>
    </IconButton>
  );
}
