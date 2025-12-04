import { useConvexAuth } from 'convex/react';
import type { ReactNode } from 'react';

export const Authed = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useConvexAuth();

  if (!isAuthenticated) return null;

  return children;
};
