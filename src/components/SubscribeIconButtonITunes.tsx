import {
  convexQuery,
  useConvexAction,
  useConvexMutation,
} from '@convex-dev/react-query';
import { AddRounded, RemoveRounded } from '@mui/icons-material';
import {
  alpha,
  IconButton,
  Tooltip,
  type IconButtonProps,
} from '@mui/material';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useMemo } from 'react';

interface SubscribeIconButtonProps extends IconButtonProps {
  itunesId: number;
}

export const SubscribeIconButtonITunes = ({
  itunesId,
  size = 'small',
  disableRipple = true,
  ...props
}: SubscribeIconButtonProps) => {
  const { data: subscribed } = useSuspenseQuery(
    convexQuery(api.subscribe.all, {})
  );

  const { mutate: subscribe, isPending } = useMutation({
    mutationFn: useConvexAction(api.actions.subscribeitunesId),
  });

  const { mutate: unsubscribe, isPending: unsubPending } = useMutation({
    mutationFn: useConvexMutation(api.subscribe.remove),
  });
  // TODO: optimistic update instead of isPending

  const { isFollowing, sub } = useMemo(() => {
    const isFollowing = subscribed?.some((s) => s.itunesId === itunesId);
    const sub = subscribed.find((s) => s.itunesId === itunesId);

    return { isFollowing, sub };
  }, [subscribed]);

  return isFollowing ? ( // && Boolean(sub?.podcastId)
    <Tooltip title='unfollow'>
      <IconButton
        {...props}
        disableRipple={disableRipple}
        size={size}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          unsubscribe({ podId: sub!.podcastId });
        }}
        loading={unsubPending}
        sx={{
          color: '#fff',
          bgcolor: alpha('#363D49', 0.5),
          '&:hover': {
            color: 'error.main',
            bgcolor: '#fff',
          },
          ...props?.sx,
        }}
      >
        <RemoveRounded fontSize='inherit' />
      </IconButton>
    </Tooltip>
  ) : (
    <Tooltip title='follow'>
      <IconButton
        {...props}
        disableRipple={disableRipple}
        size={size}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          subscribe({ itunesId });
        }}
        loading={isPending}
        sx={{
          color: '#fff',
          bgcolor: alpha('#363D49', 0.5),
          '&:hover': {
            color: 'grey.500',
            bgcolor: '#fff',
          },
          ...props?.sx,
        }}
      >
        <AddRounded fontSize='inherit' />
      </IconButton>
    </Tooltip>
  );
};
