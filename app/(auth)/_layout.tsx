import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="login-client" />
      <Stack.Screen name="login-trainer" />
      <Stack.Screen name="signup-trainer" />
      <Stack.Screen name="signup-client" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
