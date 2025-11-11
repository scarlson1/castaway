import { createTheme } from '@mui/material/styles';
import type {} from '@mui/material/themeCssVarsAugmentation';
import { colorSchemes, shape } from '~/theme/themePrimitives';

export const theme = createTheme({
  // colorSchemes: { light: true, dark: true },
  colorSchemes: colorSchemes,
  cssVariables: { colorSchemeSelector: 'data', cssVarPrefix: '' },
  shape: shape,
  typography: {
    fontFamily: "'Roboto Variable', sans-serif",
  },
});
