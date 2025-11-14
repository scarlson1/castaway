import { createFileRoute } from '@tanstack/react-router';
import { EpisodesList } from '~/components/EpisodesList';

export const Route = createFileRoute('/_authed/podcasts/$podId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { podId } = Route.useParams();
  console.log('podcast.$podId.tsx reached');
  return (
    <>
      <EpisodesList podId={podId} />
    </>
  );
}
