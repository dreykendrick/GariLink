import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../src/stores/auth.store';
import { Colors } from '../src/theme/tokens';
import { View, Text } from 'react-native';
import { useOffline } from '../src/hooks/useOffline';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'An unexpected error occurred',
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'An unexpected error occurred',
      });
    },
  }),
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default function RootLayout(): JSX.Element | null {
  const { hydrate, isHydrated } = useAuthStore();
  const { isOffline } = useOffline();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!isHydrated) {
    // Show splash or loading while hydrating auth state
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" backgroundColor={Colors.dark.bg} />
          {isOffline && (
            <View style={{ backgroundColor: Colors.error[500], padding: 10, alignItems: 'center', paddingTop: 50 }}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>You are currently offline</Text>
            </View>
          )}
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: Colors.dark.bg },
              headerTintColor: Colors.dark.text,
              headerTitleStyle: {
                fontFamily: 'Inter_600SemiBold',
                fontSize: 17,
              },
              contentStyle: { backgroundColor: Colors.dark.bg },
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="listing/[id]" options={{ title: 'Listing Details' }} />
            <Stack.Screen name="vehicle/[id]" options={{ title: 'Vehicle Details' }} />
            <Stack.Screen name="workspace/[id]" options={{ title: 'Workspace' }} />
          </Stack>
          <Toast />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
