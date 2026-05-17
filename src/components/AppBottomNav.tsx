import { UserAvatar } from '@clerk/tanstack-react-start';
import {
  ChatRounded,
  ListRounded,
  PlaylistPlayRounded,
  PodcastsRounded,
  SearchRounded,
} from '@mui/icons-material';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useMatchRoute, useNavigate } from '@tanstack/react-router';
import { useClerkAuth } from '~/hooks/useClerkAuth';

const NAV_ITEMS = [
  { label: 'Podcasts', to: '/podcasts', icon: <PodcastsRounded /> },
  { label: 'Discover', to: '/discover', icon: <SearchRounded /> },
  //   { label: 'Trending', to: '/trending', icon: <TrendingUpRounded /> },
];

const SIGNED_IN_ITEMS = [
  { label: 'New', to: '/podcasts/feed', icon: <ListRounded /> },
  {
    label: 'Up Next',
    to: '/podcasts/progress',
    icon: <PlaylistPlayRounded />,
  },
  { label: 'Chat', to: '/chat', icon: <ChatRounded /> },
  { label: 'Profile', to: '/profile', icon: <UserAvatar /> },
];

export const AppBottomNav = () => {
  const navigate = useNavigate();
  // const { pathname } = useLocation();
  const matchRoute = useMatchRoute();
  const { isAuthenticated } = useClerkAuth();

  const items = isAuthenticated
    ? [...NAV_ITEMS, ...SIGNED_IN_ITEMS]
    : NAV_ITEMS;
  // const activeValue =
  //   items.find((item) => pathname.startsWith(item.to))?.to ?? false;
  const activeValue =
    [...items]
      .sort((a, b) => b.to.length - a.to.length)
      .find((item) => matchRoute({ to: item.to, fuzzy: true }))?.to ?? false;
  // .find((item) => pathname.startsWith(item.to))?.to ?? false;

  return (
    <Paper
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        paddingBottom: 'env(safe-area-inset-bottom)',
        px: 2,
      }}
      elevation={3}
    >
      <BottomNavigation
        value={activeValue}
        onChange={(_, newValue) => navigate({ to: newValue })}
        sx={{ '& .MuiBottomNavigationAction-root': { minWidth: 0 } }}
      >
        {items.map((item) => (
          <BottomNavigationAction
            key={item.to}
            label={item.label}
            value={item.to}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};
