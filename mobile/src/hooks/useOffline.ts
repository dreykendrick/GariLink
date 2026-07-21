import { useState, useEffect } from 'react';

export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // In a real app, you would use @react-native-community/netinfo
    // This is a mock implementation as requested
    const timer = setTimeout(() => {
      // simulate connection check if needed
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return { isOffline };
};
