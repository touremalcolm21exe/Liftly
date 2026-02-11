import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(tabs)');
  }, []);

  return null;
}
