import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Dumbbell, Users } from 'lucide-react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Dumbbell size={64} color="#1a8dff" strokeWidth={2} />
        <Text style={styles.title}>Liftly</Text>
        <Text style={styles.subtitle}>Your Fitness Journey Starts Here</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.prompt}>Get started by choosing your role</Text>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => router.push('/(auth)/signup-trainer')}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Dumbbell size={28} color="#1a8dff" strokeWidth={2} />
          </View>
          <View style={styles.buttonTextContainer}>
            <Text style={styles.roleButtonTitle}>Sign up as Trainer</Text>
            <Text style={styles.roleButtonSubtitle}>
              Manage clients and sessions
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => router.push('/(auth)/signup-client')}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Users size={28} color="#1a8dff" strokeWidth={2} />
          </View>
          <View style={styles.buttonTextContainer}>
            <Text style={styles.roleButtonTitle}>Sign up as Client</Text>
            <Text style={styles.roleButtonSubtitle}>
              Track your fitness journey
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02040a',
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#5b6f92',
    marginTop: 8,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  prompt: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -0.3,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b0f1e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(26, 141, 255, 0.1)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  roleButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  roleButtonSubtitle: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  loginText: {
    fontSize: 16,
    color: '#5b6f92',
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a8dff',
  },
});
