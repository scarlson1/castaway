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
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useCallback, useMemo } from 'react';
import { useClerkAuth } from '~/hooks/useClerkAuth';

interface SubscribeIconButtonProps extends IconButtonProps {
  itunesId: number;
}

export const SubscribeIconButtonITunes = ({
  itunesId,
  size = 'small',
  disableRipple = true,
  ...props
}: SubscribeIconButtonProps) => {
  const { isAuthenticated } = useClerkAuth();
  const { data: subscribed } = useSuspenseQuery(
    convexQuery(api.subscribe.all, {})
  );

  const queryClient = useQueryClient();
  const invalidateQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['episodesFeed'] }),
      queryClient.invalidateQueries({
        queryKey: convexQuery(api.subscribe.allDetails, {}).queryKey,
      }),
    ]);
  }, [queryClient]);

  const { mutate: subscribe, isPending } = useMutation({
    mutationFn: useConvexAction(api.actions.subscribeItunesId),
    onSuccess: invalidateQueries,
  });

  const { mutate: unsubscribe, isPending: unsubPending } = useMutation({
    mutationFn: useConvexMutation(api.subscribe.remove),
    onSuccess: invalidateQueries,
  });
  // TODO: optimistic update instead of isPending

  if (!isAuthenticated) return null;

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
