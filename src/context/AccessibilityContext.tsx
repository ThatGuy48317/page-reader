import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const ACCESSIBILITY_STORAGE_KEY = '@paperecho_accessibility_mode';

interface AccessibilityContextType {
  accessibilityMode: boolean;
  toggleAccessibilityMode: (enabled?: boolean) => Promise<void>;
  triggerHaptic: (type?: 'impact' | 'notification' | 'selection') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  accessibilityMode: false,
  toggleAccessibilityMode: async () => {},
  triggerHaptic: () => {},
});

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [accessibilityMode, setAccessibilityMode] = useState<boolean>(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
        if (stored !== null) {
          setAccessibilityMode(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load accessibility mode preference:', e);
      }
    };
    loadState();
  }, []);

  const toggleAccessibilityMode = async (enabled?: boolean) => {
    try {
      const nextState = enabled !== undefined ? enabled : !accessibilityMode;
      setAccessibilityMode(nextState);
      await AsyncStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(nextState));

      if (nextState) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      console.error('Failed to save accessibility mode preference:', e);
    }
  };

  const triggerHaptic = (type: 'impact' | 'notification' | 'selection' = 'impact') => {
    if (!accessibilityMode) return;
    try {
      if (type === 'impact') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (type === 'notification') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'selection') {
        Haptics.selectionAsync();
      }
    } catch (e) {
      // Haptics non-fatal on unsupported web/simulators
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        accessibilityMode,
        toggleAccessibilityMode,
        triggerHaptic,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
