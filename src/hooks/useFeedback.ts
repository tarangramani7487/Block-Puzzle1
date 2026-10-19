import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useMemo } from 'react';

import { haptic, type HapticKind } from '../utils/haptics';
import { useLatest } from './useLatest';

export type SoundName = 'pickup' | 'tick' | 'return' | 'place' | 'clear' | 'combo' | 'fusion' | 'invalid' | 'gameover';

const VOLUME: Record<SoundName, number> = {
  pickup: 0.45,
  tick: 0.35,
  return: 0.4,
  place: 0.8,
  clear: 0.7,
  combo: 0.7,
  fusion: 0.6,
  invalid: 0.5,
  gameover: 0.7,
};

/**
 * Sound effects + haptics gated by the user's settings.
 * Players are created once and rewound on every play.
 */
export function useFeedback(soundEnabled: boolean, hapticsEnabled: boolean) {
  const players: Record<SoundName, AudioPlayer> = {
    pickup: useAudioPlayer(require('../../assets/sounds/pickup.wav')),
    tick: useAudioPlayer(require('../../assets/sounds/tick.wav')),
    return: useAudioPlayer(require('../../assets/sounds/return.wav')),
    place: useAudioPlayer(require('../../assets/sounds/place.wav')),
    clear: useAudioPlayer(require('../../assets/sounds/clear.wav')),
    combo: useAudioPlayer(require('../../assets/sounds/combo.wav')),
    fusion: useAudioPlayer(require('../../assets/sounds/fusion.wav')),
    invalid: useAudioPlayer(require('../../assets/sounds/invalid.wav')),
    gameover: useAudioPlayer(require('../../assets/sounds/gameover.wav')),
  };
  const playersRef = useLatest(players);

  useEffect(() => {
    // Game sounds should never interrupt the player's own music.
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (!soundEnabled) return;
      try {
        const player = playersRef.current[name];
        player.volume = VOLUME[name];
        player.seekTo(0).catch(() => {});
        player.play();
      } catch {
        // Audio failures must never affect gameplay.
      }
    },
    [soundEnabled, playersRef],
  );

  const vibrate = useCallback(
    (kind: HapticKind) => {
      if (hapticsEnabled) haptic(kind);
    },
    [hapticsEnabled],
  );

  return useMemo(() => ({ play, vibrate }), [play, vibrate]);
}
