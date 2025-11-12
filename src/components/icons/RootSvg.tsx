// import { styled, Theme } from '@mui/material/styles';
// import { SxProps } from '@mui/system';

import { styled, type SxProps, type Theme } from '@mui/material';

export type RootSvgProps<P = unknown> = Omit<
  React.SVGProps<SVGSVGElement>,
  'ref'
> & {
  sx?: SxProps<Theme>;
  ref?: React.Ref<SVGSVGElement>;
} & P;

export const RootSvg = styled('svg')({
  verticalAlign: 'bottom',
});
