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

interface SubscribeIconButtonProps extends IconButtonProps {
  podcastId: string;
}

export const SubscribeIconButton = ({
  podcastId,
  size = 'small',
  disableRipple = true,
  ...props
}: SubscribeIconButtonProps) => {
  // don't need to invalidate cache b/c convex reactively updates ??
  const { data: subscribed } = useSuspenseQuery(
    convexQuery(api.subscribe.all, {})
  );

  const { mutate: subscribe, isPending } = useMutation({
    mutationFn: useConvexAction(api.actions.subscribe),
  });

  const { mutate: unsubscribe, isPending: unsubPending } = useMutation({
    mutationFn: useConvexMutation(api.subscribe.remove),
  });
  // TODO: optimistic update instead of isPending

  const isFollowing = subscribed?.some((s) => s.podcastId === podcastId);

  return !!isFollowing ? (
    <Tooltip title='unfollow'>
      <IconButton
        {...props}
        disableRipple={disableRipple}
        size={size}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          unsubscribe({ podId: podcastId });
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
          subscribe({ podcastId });
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
