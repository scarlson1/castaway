import { createFileRoute } from '@tanstack/react-router';
import { StreamingChat } from '~/components/Chat/StreamingChat';

export const Route = createFileRoute('/_authed/chat/streaming')({
  component: RouteComponent,
});

function RouteComponent() {
  return <StreamingChat />;
}
