import { ListItemButton, type ListItemButtonProps } from '@mui/material';
import type { LinkComponent } from '@tanstack/react-router';
import { createLink } from '@tanstack/react-router';
import { forwardRef } from 'react';

type MuiListItemButtonLinkProps = ListItemButtonProps<'a'>;

const MuiListItemButtonLinkComponent = forwardRef<
  HTMLAnchorElement,
  MuiListItemButtonLinkProps
>((props, ref) => <ListItemButton ref={ref} component='a' {...props} />);

const CreatedListItemButtonLinkComponent = createLink(
  MuiListItemButtonLinkComponent
);

export const MuiListItemButtonLink: LinkComponent<
  typeof MuiListItemButtonLinkComponent
> = (props) => {
  return <CreatedListItemButtonLinkComponent preload={'intent'} {...props} />;
};
