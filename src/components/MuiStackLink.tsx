import { Stack, type StackProps } from '@mui/material';
import type { LinkComponent } from '@tanstack/react-router';
import { createLink } from '@tanstack/react-router';
import { forwardRef } from 'react';

type MuiStackLinkProps = StackProps<'a'>;

const MuiStackLinkComponent = forwardRef<HTMLAnchorElement, MuiStackLinkProps>(
  (props, ref) => <Stack ref={ref} component='a' {...props} />
);

const CreatedStackLinkComponent = createLink(MuiStackLinkComponent);

export const MuiStackLink: LinkComponent<typeof MuiStackLinkComponent> = (
  props
) => {
  return <CreatedStackLinkComponent preload={'intent'} {...props} />;
};
