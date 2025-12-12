import { createFileRoute } from '@tanstack/react-router';
import { Chat } from '~/components/Chat';

export const Route = createFileRoute('/_authed/chat/$threadId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { threadId } = Route.useParams();

  return <Chat threadId={threadId} />;
}
