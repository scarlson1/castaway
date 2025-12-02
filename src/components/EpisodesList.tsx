import {
  convexQuery,
  useConvexAction,
  useConvexPaginatedQuery,
} from '@convex-dev/react-query';
import { MoreVertRounded, RefreshRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useCallback, useState } from 'react';
import { EpisodeRow } from '~/components/EpisodeRow';
import { useAsyncToast } from '~/hooks/useAsyncToast';

interface EpisodesListProps {
  podId: string;
}

export const EpisodesList = ({ podId }: EpisodesListProps) => {
  const [pageSize, setPageSize] = useState(10);

  const userPlayback = useQuery(convexQuery(api.playback.getAllForUser, {}));

  // const playbackEpisodeIds = useMemo(() => {
  //   return userPlayback.data?.map((p) => p.episodeId);
  // }, [userPlayback.data]);

  // convex hook wrapped with react query
  const { results, status, loadMore, isLoading } = useConvexPaginatedQuery(
    api.episodes.getByPodcast,
    { podId },
    { initialNumItems: pageSize }
  );

  return (
    <>
      <Stack
        direction='row'
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
      >
        <Typography variant='h6' gutterBottom>
          Episodes
        </Typography>
        <Box>
          <EpisodesOptionsButton podId={podId} />
        </Box>
      </Stack>
      <Divider />

      <Box>
        {results.map((e) => {
          // const found = playbackEpisodeIds?.findIndex((epId) => epId === e.episodeId);
          // let playbackId: Id<'user_playback'> | undefined = undefined;
          // if (found !== undefined && found >= 0)
          //   playbackId = userPlayback.data![found]?._id;

          const playback = userPlayback?.data?.find(
            (p) => p.episodeId === e.episodeId
          );

          return (
            <Box key={e._id}>
              <EpisodeRow episode={e} playback={playback} />
              <Divider />
            </Box>
          );
        })}
      </Box>

      {status === 'CanLoadMore' ? (
        <Button
          size='small'
          onClick={() => loadMore(pageSize)}
          loading={isLoading}
          sx={{ m: 1 }}
        >
          Load more episodes
        </Button>
      ) : null}
      {status === 'Exhausted' ? (
        <Button size='small' disabled sx={{ m: 1 }}>
          All episodes loaded
        </Button>
      ) : null}
    </>
  );
};

// TODO: use tanstack table or mui X datagrid

// interface WrappedEpisodeRowProps {
//   episode: Doc<'episodes'>;
//   playbackId?: Id<'user_playback'> | null;
// }

// function WrappedEpisodeRow({episode, playbackId}:WrappedEpisodeRowProps) {
//   const { data: playback } = useQuery({
//     ...convexQuery(api.playback.getById, {
//       id: playbackId as Id<'user_playback'>,
//     }),
//     enabled: Boolean(playbackId), // not working ?? fires anyway ??
//   });

//   return (
//     <EpisodeRow  />
//   )
// }

const ITEM_HEIGHT = 48;

function EpisodesOptionsButton({ podId }: { podId: string }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const toast = useAsyncToast();

  const { mutate: refresh, isPending } = useMutation({
    mutationFn: useConvexAction(api.episodes.refreshByPodId),
    onMutate: () => toast.loading(`checking for new episodes`),
    onSuccess: ({ newEpisodes }) =>
      toast.success(`${newEpisodes} new episodes found`),
    onError: () => toast.error('something went wrong'),
  });

  const refreshEpisodes = useCallback(() => {
    refresh({ podId });
    handleClose();
  }, [handleClose, refresh]);

  return (
    <>
      <IconButton
        size='small'
        aria-label='more'
        id='episode-options-button'
        aria-controls={open ? 'episode-options-button' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup='true'
        onClick={handleClick}
      >
        <MoreVertRounded fontSize='inherit' />
      </IconButton>
      <Menu
        id='episode-options-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            style: {
              maxHeight: ITEM_HEIGHT * 4.5,
              // width: '20ch',
              // width: 180,
            },
          },
          // list: {
          //   'aria-labelledby': 'long-button',
          // },
        }}
      >
        {/* {options.map((option) => ( */}
        <MenuItem disabled={isPending} onClick={() => refreshEpisodes()}>
          <ListItemIcon>
            <RefreshRounded fontSize='small' />
          </ListItemIcon>
          <ListItemText>Refresh episode list</ListItemText>
        </MenuItem>
        {/* ))} */}
      </Menu>
    </>
  );
}
