import type { ButtonProps } from '@mui/material';
import { Button } from '@mui/material';
import type { LinkComponent } from '@tanstack/react-router';
import { createLink } from '@tanstack/react-router';
import { forwardRef } from 'react';

// interface MuiButtonLinkProps extends ButtonProps<'a'> {
//   // Add any additional props you want to pass to the Button
// }
type MuiButtonLinkProps = ButtonProps<'a'>;

const MuiButtonLinkComponent = forwardRef<
  HTMLAnchorElement,
  MuiButtonLinkProps
>((props, ref) => <Button ref={ref} component='a' {...props} />);

const CreatedButtonLinkComponent = createLink(MuiButtonLinkComponent);

export const MuiButtonLink: LinkComponent<typeof MuiButtonLinkComponent> = (
  props
) => {
  return <CreatedButtonLinkComponent preload={'intent'} {...props} />;
};
