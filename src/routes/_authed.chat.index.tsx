import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { Chat } from '~/components/Chat';

export const Route = createFileRoute('/_authed/chat/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Suspense fallback={<div>loading...</div>}>
      <Chat />
    </Suspense>
  );
}
