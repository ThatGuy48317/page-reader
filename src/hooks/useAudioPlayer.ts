import { useState, useEffect, useCallback } from 'react';
import { useAudioPlayer as useExpoAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';

export function useAudioPlayer(audioUri: string | undefined) {
  const [rate, setRateState] = useState(1.0);
  const player = useExpoAudioPlayer(audioUri ? { uri: audioUri } : null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    }).catch(console.error);
  }, []);

  const play = useCallback(() => {
    try {
      player.play();
    } catch (e) {
      console.error('Play error', e);
    }
  }, [player]);

  const pause = useCallback(() => {
    try {
      player.pause();
    } catch (e) {
      console.error('Pause error', e);
    }
  }, [player]);

  const seekTo = useCallback((positionSec: number) => {
    try {
      player.seekTo(positionSec);
    } catch (e) {
      console.error('Seek error', e);
    }
  }, [player]);

  const skipForward = useCallback((seconds: number = 15) => {
    try {
      const current = status.currentTime || 0;
      const total = status.duration || 0;
      const target = Math.min(current + seconds, total);
      player.seekTo(target);
    } catch (e) {
      console.error('Skip forward error', e);
    }
  }, [player, status.currentTime, status.duration]);

  const skipBack = useCallback((seconds: number = 15) => {
    try {
      const current = status.currentTime || 0;
      const target = Math.max(current - seconds, 0);
      player.seekTo(target);
    } catch (e) {
      console.error('Skip back error', e);
    }
  }, [player, status.currentTime]);

  const setRate = useCallback((newRate: number) => {
    try {
      if (typeof (player as any).setPlaybackRate === 'function') {
        (player as any).setPlaybackRate(newRate);
      } else {
        (player as any).playbackRate = newRate;
      }
      setRateState(newRate);
    } catch (e) {
      console.error('Set rate error', e);
    }
  }, [player]);

  return {
    isPlaying: status.playing,
    position: status.currentTime || 0, // in seconds
    duration: status.duration || 0,     // in seconds
    rate,
    isLoading: !status.isLoaded || status.isBuffering,
    play,
    pause,
    seekTo,
    skipForward,
    skipBack,
    setRate,
  };
}
