import { useCallback, useRef } from 'react';

export const useTones = () => {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  };

  // Two descending beeps: 880 Hz then 660 Hz, 100ms each with a 40ms gap
  const playWarningTone = useCallback(() => {
    const ctx = getCtx();
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.value = 0.15;
      osc.connect(gain).connect(ctx.destination);
      const start = ctx.currentTime + i * 0.14;
      osc.start(start);
      osc.stop(start + 0.1);
    });
  }, []);

  // Ascending frequency sweep 300 → 800 Hz over 150ms
  const playSkipTone = useCallback(() => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.15);
    gain.gain.value = 0.15;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }, []);

  return { playWarningTone, playSkipTone };
};
