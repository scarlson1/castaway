import { Typography, type TypographyProps } from '@mui/material';
import { createLink } from '@tanstack/react-router';
import { forwardRef } from 'react';

const TypographyLinkComponent = forwardRef<HTMLAnchorElement, TypographyProps>(
  (props, ref) => {
    return (
      <Typography
        component='a'
        ref={ref}
        {...props}
        sx={[
          { textDecoration: 'none', color: 'text.primary' },
          ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
        ]}
      />
    );
  },
);

export const TypographyLink = createLink(TypographyLinkComponent);
