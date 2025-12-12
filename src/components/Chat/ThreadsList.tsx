import {
  useConvexAction,
  useConvexMutation,
  useConvexPaginatedQuery,
} from '@convex-dev/react-query';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useState } from 'react';

export const ThreadsList = () => {
  const navigate = useNavigate();
  const params = useParams({ strict: false }); // from: '/_authed/chat/$threadId'
  const currentChatId = params?.threadId;

  const { results, status, loadMore, isLoading } = useConvexPaginatedQuery(
    api.agent.threads.list,
    {},
    { initialNumItems: 10 }
  );

  const { mutate: overrideTitle } = useMutation({
    mutationFn: useConvexAction(api.agent.threads.overrideTitle),
    // onSuccess,
    // onError
  });

  const deleteFn = useConvexMutation(api.agent.threads.deleteThread);

  const { mutate: deleteThread } = useMutation({
    mutationFn: deleteFn,
    onMutate: async ({ threadId }) => {
      const isActiveThread = currentChatId === threadId;
      if (isActiveThread) await navigate({ to: '/chat' });
      return { isActiveThread };
    },
    onSuccess: (_, { threadId }) => {
      // TODO: need to optimistically delete & navigate onMutate ??
      if (currentChatId === threadId) navigate({ to: '/chat' });
    },
    // onError
  });

  return (
    <List dense>
      {results.map((t) => (
        <ChatListItem
          key={t._id}
          threadId={t._id}
          title={t.title || 'New chat'}
          selected={currentChatId === t._id}
          onRename={(threadId, title) => overrideTitle({ threadId, title })}
          onDelete={(threadId) => deleteThread({ threadId })}
        />
      ))}
      {status !== 'Exhausted' ? (
        <ListItemButton
          onClick={() => loadMore(5)}
          // loading={status === 'LoadingMore'}
          disabled={status !== 'CanLoadMore'}
        >
          <ListItemText primary='Load more' />
        </ListItemButton>
      ) : null}
    </List>
  );
};

// <ListItem key={t._id} disablePadding>
//   <MuiListItemButtonLink
//     to='/chat/$threadId'
//     params={{ threadId: t._id }}
//     selected={currentChatId === t._id}
//     disableGutters
//     sx={{
//       whiteSpace: 'nowrap',
//       overflow: 'hidden',
//       textOverflow: 'ellipsis',
//       px: 1,
//       borderRadius: 1,
//     }}
//   >
//     <ListItemText
//       primary={t.title || 'new chat'}
//       slotProps={{
//         primary: { noWrap: true },
//       }}
//     />
//   </MuiListItemButtonLink>
// </ListItem>

interface ChatListItemProps {
  threadId: string;
  title: string;
  selected?: boolean;
  onRename: (threadId: string, newTitle: string) => void;
  onDelete: (threadId: string) => void;
}

export function ChatListItem({
  threadId,
  title,
  selected,
  onRename,
  onDelete,
}: ChatListItemProps) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  const open = Boolean(anchorEl);

  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const startRename = () => {
    setDraftTitle(title);
    setIsRenaming(true);
    handleMenuClose();
  };

  const commitRename = () => {
    if (draftTitle.trim() && draftTitle !== title) {
      onRename(threadId, draftTitle.trim());
    }
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setDraftTitle(title);
    setIsRenaming(false);
  };

  return (
    <ListItem
      disablePadding
      disableGutters
      secondaryAction={
        !isRenaming && (
          <IconButton
            size='small'
            onClick={handleMenuOpen}
            className='chat-actions'
            sx={{ opacity: 0 }}
          >
            <MoreVertIcon fontSize='small' />
          </IconButton>
        )
      }
      sx={{
        '&:hover .chat-actions': { opacity: 1 },
      }}
    >
      <ListItemButton
        selected={selected}
        disabled={isRenaming}
        onClick={() =>
          navigate({
            to: '/chat/$threadId',
            params: { threadId },
          })
        }
        sx={{ borderRadius: 1, px: 1.5 }}
      >
        {isRenaming ? (
          <TextField
            value={draftTitle}
            size='small'
            autoFocus
            fullWidth
            variant='standard'
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') cancelRename();
            }}
            slotProps={{
              input: { disableUnderline: false },
            }}
          />
        ) : (
          <ListItemText
            primary={title}
            slotProps={{
              primary: { noWrap: true, fontSize: 14 },
            }}
          />
        )}
      </ListItemButton>

      {/* Options menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={startRename} sx={{ orderRadius: 1 }}>
          <ListItemIcon>
            <EditIcon fontSize='small' />
          </ListItemIcon>
          <Typography variant='body2' fontSize={'0.9rem'}>
            Rename
          </Typography>
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleMenuClose();
            onDelete(threadId);
          }}
          sx={{ color: 'error.main', borderRadius: 1 }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize='small' />
          </ListItemIcon>
          <Typography variant='body2' fontSize={'0.9rem'}>
            Delete
          </Typography>
        </MenuItem>
      </Menu>
    </ListItem>
  );
}

// interface ChatListItemProps {
//   threadId: string;
//   title: string;
//   selected?: boolean;
//   onRename: (id: string) => void;
//   onDelete: (id: string) => void;
// }

// function ChatListItem({
//   threadId,
//   title,
//   selected,
//   onRename,
//   onDelete,
// }: ChatListItemProps) {
//   const navigate = useNavigate();
//   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

//   const open = Boolean(anchorEl);

//   const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
//     e.stopPropagation(); // ⛔ prevent navigation
//     setAnchorEl(e.currentTarget);
//   };

//   const handleMenuClose = () => setAnchorEl(null);

//   return (
//     <ListItem
//       disablePadding
//       secondaryAction={
//         <IconButton
//           size='small'
//           onClick={handleMenuOpen}
//           className='chat-actions'
//           sx={{ opacity: 0 }}
//         >
//           <MoreVertIcon fontSize='small' />
//         </IconButton>
//       }
//       sx={{
//         '&:hover .chat-actions': { opacity: 1 },
//       }}
//     >
//       <ListItemButton
//         selected={selected}
//         onClick={() =>
//           navigate({
//             to: '/chat/$threadId',
//             params: { threadId },
//           })
//         }
//         sx={{ borderRadius: 2, px: 2 }}
//       >
//         <ListItemText
//           primary={title}
//           primaryTypographyProps={{
//             noWrap: true,
//             fontSize: 14,
//           }}
//         />
//       </ListItemButton>

//       {/* Options menu */}
//       <Menu
//         anchorEl={anchorEl}
//         open={open}
//         onClose={handleMenuClose}
//         onClick={(e) => e.stopPropagation()} // ⛔ prevent navigation
//         anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
//         transformOrigin={{ vertical: 'top', horizontal: 'right' }}
//       >
//         <MenuItem
//           onClick={() => {
//             handleMenuClose();
//             onRename(threadId);
//           }}
//         >
//           <ListItemIcon>
//             <EditIcon fontSize='small' />
//           </ListItemIcon>
//           Rename
//         </MenuItem>

//         <MenuItem
//           onClick={() => {
//             handleMenuClose();
//             onDelete(threadId);
//           }}
//           sx={{ color: 'error.main' }}
//         >
//           <ListItemIcon sx={{ color: 'error.main' }}>
//             <DeleteIcon fontSize='small' />
//           </ListItemIcon>
//           Delete
//         </MenuItem>
//       </Menu>
//     </ListItem>
//   );
// }
