import { UserProfile } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authed/profile')({
  component: UserProfilePage,
});

function UserProfilePage() {
  return <UserProfile />;
}
