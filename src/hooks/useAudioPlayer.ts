import { useState, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';

export function useAudioPlayer(audioUri: string | undefined) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRateState] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let currentSound: Audio.Sound | null = null;

    const setupAudio = async () => {
      if (!audioUri) return;
      
      try {
        setIsLoading(true);
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: false, rate },
          (status) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying);
              setPosition(status.positionMillis);
              setDuration(status.durationMillis || 0);
              
              if (status.didJustFinish) {
                setIsPlaying(false);
                setPosition(0);
              }
            } else if (status.error) {
              console.error('Playback Error:', status.error);
            }
          }
        );
        
        currentSound = newSound;
        setSound(newSound);
      } catch (error) {
        console.error('Error loading audio:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setupAudio();

    return () => {
      if (currentSound) {
        currentSound.unloadAsync();
      }
    };
  }, [audioUri]);

  const play = useCallback(async () => {
    if (sound) {
      await sound.playAsync();
    }
  }, [sound]);

  const pause = useCallback(async () => {
    if (sound) {
      await sound.pauseAsync();
    }
  }, [sound]);

  const seekTo = useCallback(async (positionMs: number) => {
    if (sound) {
      await sound.setPositionAsync(positionMs);
    }
  }, [sound]);

  const skipForward = useCallback(async (seconds: number = 15) => {
    if (sound) {
      const newPosition = Math.min(position + seconds * 1000, duration);
      await sound.setPositionAsync(newPosition);
    }
  }, [sound, position, duration]);

  const skipBack = useCallback(async (seconds: number = 15) => {
    if (sound) {
      const newPosition = Math.max(position - seconds * 1000, 0);
      await sound.setPositionAsync(newPosition);
    }
  }, [sound, position]);

  const setRate = useCallback(async (newRate: number) => {
    if (sound) {
      await sound.setRateAsync(newRate, true);
      setRateState(newRate);
    }
  }, [sound]);

  return {
    isPlaying,
    position,
    duration,
    rate,
    isLoading,
    play,
    pause,
    seekTo,
    skipForward,
    skipBack,
    setRate,
  };
}
