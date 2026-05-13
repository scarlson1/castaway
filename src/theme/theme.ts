import { createTheme } from '@mui/material/styles';
import type {} from '@mui/material/themeCssVarsAugmentation';
import { colorSchemes, shape } from '~/theme/themePrimitives';

export const modeStorageKey = 'castaway-theme-mode';
export const colorSchemeSelector = 'data';

export const theme = createTheme({
  colorSchemes,
  cssVariables: { colorSchemeSelector, cssVarPrefix: '' },
  shape,
  typography: {
    fontFamily: "'Inter Tight', system-ui, sans-serif",
    h1: { letterSpacing: '-0.03em' },
    h2: { letterSpacing: '-0.025em' },
    h3: { letterSpacing: '-0.02em' },
    h4: { letterSpacing: '-0.02em', fontWeight: 600 },
    h5: { letterSpacing: '-0.01em', fontWeight: 600 },
    h6: { letterSpacing: '-0.01em', fontWeight: 600 },
  },
});
