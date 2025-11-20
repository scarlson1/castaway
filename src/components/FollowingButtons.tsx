import {
  convexQuery,
  useConvexAction,
  useConvexMutation,
} from '@convex-dev/react-query';
import { AddRounded, CheckRounded, RemoveRounded } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useRef, type RefObject } from 'react';
import { useHover } from '~/hooks/useHover';

export function FollowingButtons({ podId }: { podId: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isHovering] = useHover(ref as RefObject<HTMLButtonElement>);
  const { mutate: subscribe, isPending } = useMutation({
    mutationFn: useConvexAction(api.actions.subscribe),
  });

  const { mutate: unsubscribe, isPending: unsubPending } = useMutation({
    mutationFn: useConvexMutation(api.subscribe.remove),
  });

  const { data: isFollowing } = useSuspenseQuery(
    convexQuery(api.subscribe.isFollowing, { podId })
  );

  return (
    <>
      {!isFollowing ? (
        <Button
          loading={isPending}
          onClick={() => subscribe({ podcastId: podId })}
          startIcon={<AddRounded fontSize='inherit' />}
        >
          Follow
        </Button>
      ) : (
        <Button
          component='button'
          ref={ref}
          loading={unsubPending}
          onClick={() => unsubscribe({ podId })}
          startIcon={
            isHovering ? (
              <RemoveRounded fontSize='inherit' />
            ) : (
              <CheckRounded fontSize='inherit' />
            )
          }
          sx={{ minWidth: 80 }}
        >
          {`${isHovering ? 'Unfollow' : 'Following'}`}
        </Button>
      )}
    </>
  );
}
