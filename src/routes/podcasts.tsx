import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/podcasts')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/podcasts"!</div>
}
