import { alpha } from '@mui/material/styles';

const rust = {
  50: '#fdf1ec',
  100: '#fad9ca',
  200: '#f5b39a',
  300: '#ee8d6a',
  400: '#e87a4a',
  500: '#a8431f',
  600: '#8a3518',
  700: '#6c2912',
  800: '#4e1d0c',
  900: '#301106',
};

const warm = {
  50: '#fafaf7',
  100: '#f4f3ee',
  200: '#e5e3dc',
  300: '#d9d6cc',
  400: '#cabfa8',
  500: '#9b9180',
  600: '#7a7466',
  700: '#5a5448',
  800: '#3a3325',
  900: '#262218',
};

export const colorSchemes = {
  light: {
    palette: {
      primary: {
        light: rust[300],
        main: rust[500],
        dark: rust[700],
        contrastText: '#fff',
      },
      secondary: {
        light: warm[200],
        main: warm[500],
        dark: warm[700],
        contrastText: warm[50],
      },
      info: {
        light: rust[100],
        main: rust[300],
        dark: rust[600],
        contrastText: '#fff',
      },
      warning: {
        light: '#f4d35e',
        main: '#e8c232',
        dark: '#b89a1a',
      },
      error: {
        light: '#f5a09a',
        main: '#d32f2f',
        dark: '#c62828',
      },
      success: {
        light: '#84b88a',
        main: '#5a9462',
        dark: '#3a6942',
      },
      grey: { ...warm },
      divider: warm[200],
      background: {
        default: warm[50],
        paper: '#ffffff',
      },
      text: {
        primary: '#111111',
        secondary: '#666666',
      },
      action: {
        hover: alpha('#111111', 0.04),
        selected: alpha('#111111', 0.08),
      },
    },
  },
  dark: {
    palette: {
      primary: {
        light: rust[300],
        main: rust[400],
        dark: rust[600],
        contrastText: '#fff',
      },
      secondary: {
        light: warm[700],
        main: warm[600],
        dark: warm[800],
        contrastText: warm[50],
      },
      info: {
        light: rust[400],
        main: rust[500],
        dark: rust[700],
        contrastText: '#fff',
      },
      warning: {
        light: '#f4d35e',
        main: '#e8c232',
        dark: '#b89a1a',
      },
      error: {
        light: rust[300],
        main: rust[400],
        dark: rust[600],
      },
      success: {
        light: '#84b88a',
        main: '#5a9462',
        dark: '#3a6942',
      },
      grey: { ...warm },
      divider: warm[900],
      background: {
        default: '#0e0d0a',
        paper: '#161410',
      },
      text: {
        primary: '#fafaf7',
        secondary: '#9b9180',
      },
      action: {
        hover: alpha('#fafaf7', 0.04),
        selected: alpha('#fafaf7', 0.08),
      },
    },
  },
};

export const shape = {
  borderRadius: 8,
};
