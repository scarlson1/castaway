import { Stack, Typography } from '@mui/material';
import type { Doc } from 'convex/_generated/dataModel';
import { MuiLink } from '~/components/MuiLink';
import { PlaybackButton } from '~/components/PlaybackButton';
import { formatTimestamp, getDuration } from '~/utils/format';

interface EpisodeRowProps {
  playback?: Doc<'user_playback'>;
  episode: Doc<'episodes'>;
}

export function EpisodeRow({ playback, episode }: EpisodeRowProps) {
  return (
    <Stack
      direction='row'
      sx={{ alignItems: 'center', my: { xs: 0.5, sm: 1 } }}
      spacing={2}
    >
      <Typography
        color='textSecondary'
        sx={{ width: 80, flex: '0 0 80px', overflow: 'hidden' }}
      >
        {episode.episode
          ? `E${episode.episode}`
          : episode.episodeType === 'bonus'
          ? 'bonus'
          : ''}
      </Typography>
      <MuiLink
        to='/podcasts/$podId/episodes/$episodeId'
        params={{ podId: episode.podcastId, episodeId: episode.episodeId }}
        underline='hover'
        sx={{ flex: '1 1 auto', color: 'inherit', minWidth: 0 }}
      >
        <Typography
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: '1 1 60%',
          }}
        >
          {episode.podcastTitle}
        </Typography>
      </MuiLink>
      <Typography
        variant='body2'
        color='textSecondary'
        sx={{
          width: 80,
          flex: '0 0 80px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {formatTimestamp(episode?.publishedAt)}
      </Typography>
      <Typography
        variant='body2'
        color='textSecondary'
        sx={{ width: 80, flex: '0 0 80px' }}
      >
        {episode?.durationSeconds ? getDuration(episode.durationSeconds) : ''}
      </Typography>
      <PlaybackButton
        episode={episode}
        positionSeconds={playback?.positionSeconds || 0}
        playedPercentage={playback?.playedPercentage}
      />
    </Stack>
  );
}
