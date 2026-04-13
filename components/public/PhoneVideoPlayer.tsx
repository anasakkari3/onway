'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import {
  PhoneVideoComposition,
  PHONE_VIDEO_DURATION,
  PHONE_VIDEO_FPS,
  PHONE_VIDEO_WIDTH,
  PHONE_VIDEO_HEIGHT,
} from './PhoneVideoComposition';

// useSyncExternalStore is the React-recommended way to detect client mount
// without calling setState inside useEffect (which causes cascading renders).
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function PhoneVideoPlayer() {
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const playerRef = useRef<PlayerRef>(null);

  // Auto-play once the player is ready
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      playerRef.current?.play();
    }, 100);
    return () => clearTimeout(t);
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-[3px] border-sky-400/40 border-t-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <Player
      ref={playerRef}
      component={PhoneVideoComposition}
      durationInFrames={PHONE_VIDEO_DURATION}
      fps={PHONE_VIDEO_FPS}
      compositionWidth={PHONE_VIDEO_WIDTH}
      compositionHeight={PHONE_VIDEO_HEIGHT}
      style={{ width: '100%', height: '100%' }}
      loop
      controls={false}
      clickToPlay={false}
    />
  );
}
