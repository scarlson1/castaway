import { createTheme } from '@mui/material/styles';
import type {} from '@mui/material/themeCssVarsAugmentation';
import { colorSchemes, shape } from '~/theme/themePrimitives';

export const modeStorageKey = 'castaway-theme-mode';
export const colorSchemeSelector = 'data';

export const theme = createTheme({
  colorSchemes: colorSchemes,
  cssVariables: { colorSchemeSelector, cssVarPrefix: '' },
  shape: shape,
  typography: {
    fontFamily: "'Roboto Variable', sans-serif",
  },
});
