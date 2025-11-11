import type { LinkProps } from '@mui/material';
import { Link } from '@mui/material';
import type { LinkComponent } from '@tanstack/react-router';
import { createLink } from '@tanstack/react-router';
import React from 'react';

// interface MuiLinkProps extends LinkProps {
//   // Add any additional props you want to pass to the Link
// }
type MuiLinkProps = LinkProps;

const MuiLinkComponent = React.forwardRef<HTMLAnchorElement, MuiLinkProps>(
  (props, ref) => <Link ref={ref} {...props} />
);

const CreatedLinkComponent = createLink(MuiLinkComponent);

export const MuiLink: LinkComponent<typeof MuiLinkComponent> = (props) => {
  return <CreatedLinkComponent preload={'intent'} {...props} />;
};

// Can also be styled
