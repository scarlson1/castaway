import { createIsomorphicFn } from '@tanstack/react-start';
import { useEffect, useLayoutEffect } from 'react';

// export const useIsomorphicLayoutEffect =
//   typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// API: Framework handles it
export const useIsomorphicLayoutEffect = createIsomorphicFn()
  .server(useEffect)
  .client(useLayoutEffect);
