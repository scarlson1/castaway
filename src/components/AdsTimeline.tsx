import {
  SentimentDissatisfiedRounded,
  SentimentVeryDissatisfiedRounded,
} from '@mui/icons-material';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from '@mui/lab';
// import TimelineConnector from '@mui/lab/TimelineConnector';
// import TimelineContent from '@mui/lab/TimelineContent';
// import TimelineDot from '@mui/lab/TimelineDot';
// import TimelineItem from '@mui/lab/TimelineItem';
// import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
// import TimelineSeparator from '@mui/lab/TimelineSeparator';
import { Paper, Popper, Typography } from '@mui/material';
import type { Doc } from 'convex/_generated/dataModel';
import { useRef, type RefObject } from 'react';
import { useHover } from '~/hooks/useHover';
import { formatTime } from '~/routes/_authed.podcasts_.$podId_.episodes_.$episodeId';

interface AdsTimelineProps {
  adSegments: Doc<'ads'>[];
}

export const AdsTimeline = ({ adSegments }: AdsTimelineProps) => {
  return (
    <Timeline position='alternate'>
      {adSegments.map((s) => (
        <TimelineItem key={s._id}>
          <TimelineOppositeContent
            sx={{ m: 'auto 0' }}
            align='right'
            variant='body2'
            color='text.secondary'
          >
            {`${s.duration}s`}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <HoverSnippetTimelineDot
              snippet={s.transcript}
              confidence={s.confidence}
            />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent sx={{ py: 3, px: 2 }}>
            <Typography variant='h6' component='span'>
              {`${formatTime(s.start)}-${formatTime(s.end)}`}
            </Typography>
            <Typography>{`Confidence: ${s.confidence.toFixed(2)}`}</Typography>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

function HoverSnippetTimelineDot({
  snippet,
  confidence,
}: {
  snippet: string;
  confidence: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [isHovering] = useHover<HTMLElement>(ref as RefObject<HTMLElement>);

  const paperRef = useRef<HTMLDivElement>(null);
  const [paperHovering] = useHover<HTMLDivElement>(
    paperRef as RefObject<HTMLDivElement>
  );

  return (
    <>
      <TimelineDot ref={ref}>
        {confidence >= 0.9 ? (
          <SentimentVeryDissatisfiedRounded color='error' />
        ) : (
          <SentimentDissatisfiedRounded color='warning' />
        )}
      </TimelineDot>
      <Popper open={isHovering || paperHovering} anchorEl={ref.current}>
        <Paper
          ref={paperRef}
          sx={{ p: 2, maxWidth: 500, maxHeight: 400, overflow: 'auto' }}
        >
          <Typography component='div' variant='body2'>
            {snippet}
          </Typography>
        </Paper>
      </Popper>
    </>
  );
}
