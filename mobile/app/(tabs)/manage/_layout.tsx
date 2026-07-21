import { Stack } from 'expo-router';

export default function ManageLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Manage Listings' }} />
      <Stack.Screen name="listing/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
