import { CloseRounded, SearchRounded } from '@mui/icons-material';
import {
  AppBar,
  Dialog,
  DialogContent,
  IconButton,
  Slide,
  Toolbar,
  Typography,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { useNavigate } from '@tanstack/react-router';
import { forwardRef, useState } from 'react';
import { AutoCompleteSearch } from '~/components/AutoCompleteSearch';
import type { PodcastFeed } from '~/lib/podcastIndexTypes';

const SlideUp = forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction='up' ref={ref} {...props} />;
});

export function MobileSearchDialog() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (pod: PodcastFeed) => {
    navigate({ to: '/podcast/$podId', params: { podId: pod.id.toString() } });
    setOpen(false);
  };

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        aria-label='Search podcasts'
        size='small'
      >
        <SearchRounded />
      </IconButton>

      <Dialog
        fullScreen
        open={open}
        onClose={() => setOpen(false)}
        TransitionComponent={SlideUp}
      >
        <AppBar
          position='static'
          color='default'
          elevation={0}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Toolbar>
            <Typography variant='h6' sx={{ flex: 1 }}>
              Search
            </Typography>
            <IconButton
              onClick={() => setOpen(false)}
              aria-label='Close search'
            >
              <CloseRounded />
            </IconButton>
          </Toolbar>
        </AppBar>

        <DialogContent sx={{ pt: 2 }}>
          <AutoCompleteSearch onSelect={handleSelect} />
        </DialogContent>
      </Dialog>
    </>
  );
}
