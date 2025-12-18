import SearchIcon from '@mui/icons-material/Search';
import {
  ClickAwayListener,
  IconButton,
  InputBase,
  Paper,
  type InputBaseProps,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import * as React from 'react';

const SearchContainer = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open: boolean }>(({ theme, open }) => ({
  display: 'flex',
  alignItems: 'center',
  width: open ? 260 : 40,
  height: 40,
  padding: theme.spacing(0, 0.5),
  borderRadius: 20,
  transition: theme.transitions.create('width', {
    duration: theme.transitions.duration.shortest,
  }),
  overflow: 'hidden',
}));

interface ExpandableSearchBarProps extends Omit<InputBaseProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  // placeholder?: string;
}

export function ExpandableSearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  ...props
}: ExpandableSearchBarProps) {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setOpen(true);
    // focus after animation frame
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <SearchContainer elevation={1} open={open}>
        <IconButton
          size='small'
          onClick={open ? undefined : handleOpen}
          aria-label='open search'
        >
          <SearchIcon />
        </IconButton>

        <InputBase
          inputRef={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          sx={{
            ml: 1,
            flex: 1,
            opacity: open ? 1 : 0,
            transition: 'opacity 150ms',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleClose();
            }
          }}
          {...props}
        />
      </SearchContainer>
    </ClickAwayListener>
  );
}
