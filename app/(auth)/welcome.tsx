import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Dumbbell } from 'lucide-react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Dumbbell size={64} color="#1a8dff" strokeWidth={2} />
        <Text style={styles.title}>Liftly</Text>
        <Text style={styles.subtitle}>Professional Trainer Management</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.prompt}>Get started with your trainer account</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/signup-trainer')}
          activeOpacity={0.7}
        >
          <Text style={styles.primaryButtonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Log In</Text>
        </TouchableOpacity>
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
    marginBottom: 40,
    letterSpacing: -0.3,
  },
  primaryButton: {
    backgroundColor: '#1a8dff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  secondaryButton: {
    backgroundColor: '#0b0f1e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a8dff',
    letterSpacing: -0.3,
  },
});
