import { createFileRoute } from '@tanstack/react-router';
import { signinSearchSchema } from '~/routes/auth.signin';

export const Route = createFileRoute('/auth/signup')({
  component: RouteComponent,
  validateSearch: (search: unknown) => signinSearchSchema.parse(search),
});

function RouteComponent() {
  return <div>Hello "/auth/signup"!</div>;
}
