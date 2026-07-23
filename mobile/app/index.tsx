import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';

export default function Index(): JSX.Element {
  const { isAuthenticated } = useAuthStore();
  return (
    <Redirect href={isAuthenticated ? '/home' : '/welcome'} />
  );
}
