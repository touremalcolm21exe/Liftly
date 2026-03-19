import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { supabase } from '@/lib/supabase';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemeProvider } from '@/lib/ThemeContext';

export default function RootLayout() {
  useFrameworkReady();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Verify user has valid role (client or trainer)
        const [clientCheck, trainerCheck] = await Promise.all([
          supabase.from('clients').select('id').eq('user_id', session.user.id).maybeSingle(),
          supabase.from('trainers').select('id').eq('user_id', session.user.id).maybeSingle()
        ]);

        const hasValidRole = !!(clientCheck.data || trainerCheck.data);
        if (!hasValidRole) {
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          return;
        }
      }
      setIsAuthenticated(!!session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        (async () => {
          if (session?.user) {
            // Verify user has valid role (client or trainer)
            const [clientCheck, trainerCheck] = await Promise.all([
              supabase.from('clients').select('id').eq('user_id', session.user.id).maybeSingle(),
              supabase.from('trainers').select('id').eq('user_id', session.user.id).maybeSingle()
            ]);

            const hasValidRole = !!(clientCheck.data || trainerCheck.data);
            if (!hasValidRole) {
              await supabase.auth.signOut();
              setIsAuthenticated(false);
              return;
            }
          }
          setIsAuthenticated(!!session);
        })();
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated === null) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments]);

  if (isAuthenticated === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a8dff" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#02040a',
  },
});
