import { SignedIn } from '@clerk/tanstack-react-start';
import { alpha } from '@mui/material';
import { Card } from '~/components/Card';
import { MuiLink } from '~/components/MuiLink';
import { PlaybackButton } from '~/components/PlaybackButton';

// TODO: generalize card in trending.tsx / components/TrendingCard
export function EpisodeCard({
  imgSrc,
  title,
  podName,
  episodeId,
  podId,
  audioUrl,
  publishedAt,
  orientation = 'vertical',
}: {
  imgSrc: string;
  title: string;
  podName: string;
  episodeId: string;
  podId: string;
  audioUrl: string;
  publishedAt: number;
  orientation?: 'vertical' | 'horizontal';
}) {
  // const playEpisode = useQueueStore((state) => state.setPlaying);

  // const handlePlay = useCallback(
  //   (e: MouseEvent<HTMLButtonElement>) => {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     playEpisode({
  //       podcastId: podId,
  //       image: imgSrc || '',
  //       episodeId: episodeId,
  //       title,
  //       audioUrl,
  //       releaseDateMs: publishedAt,
  //       podName,
  //     });
  //   },
  //   [episodeId, podId, imgSrc, title, podName, publishedAt, audioUrl]
  // );

  return (
    <Card
      title={title}
      subtitle={
        <MuiLink to='/podcasts/$podId' params={{ podId }}>
          {podName}
        </MuiLink>
      }
      imgSrc={imgSrc}
      orientation={orientation}
      linkProps={{
        to: '/podcasts/$podId/episodes/$episodeId',
        params: { podId, episodeId },
      }}
    >
      <SignedIn>
        <PlaybackButton
          episode={{
            podcastId: podId,
            feedImage: imgSrc || '',
            episodeId,
            title,
            audioUrl,
            publishedAt,
            podcastTitle: podName,
          }}
          color='default'
          sx={(theme) => ({
            backgroundColor: alpha('#363D49', 0.5),
            color: '#fff',
            '&:hover': {
              color: 'primary.main',
            },
            ...theme.applyStyles('dark', {
              backgroundColor: alpha('#363D49', 0.5),
              color: '#fff',
              '&:hover': {
                color: 'primary.main',
              },
            }),
          })}
        />
        {/* <IconButton size='small' onClick={handlePlay}>
          <PlayArrowRounded fontSize='inherit' />
        </IconButton> */}
      </SignedIn>
    </Card>
  );
}
