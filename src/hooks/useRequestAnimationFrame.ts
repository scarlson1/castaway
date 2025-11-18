import { useCallback, useEffect, useMemo, useRef } from 'react';

// const desiredFPS = 30; // Set your target FPS
// const interval = 1000 / desiredFPS; // Calculate the time interval between frames in milliseconds

// let lastFrameTime = 0;

export const useAnimationFrame = (
  callback: (deltaTime: number) => void,
  desiredFPS
) => {
  // Mutable refs that won't trigger rerenders
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  // const lastFrameTime = useRef<number | null>(null)

  const interval = useMemo(() => 1000 / desiredFPS, [desiredFPS]);

  const animate = useCallback(
    (time: number) => {
      if (previousTimeRef.current !== null) {
        const deltaTime = time - previousTimeRef.current;
        if (deltaTime >= interval) {
          callback(deltaTime);
          // lastFrameTime.current = time - (deltaTime % interval)
        }
      }

      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    },
    [callback, interval]
  );

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback]);
};
