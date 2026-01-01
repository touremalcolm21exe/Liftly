import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Dumbbell, Users } from 'lucide-react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Dumbbell size={64} color="#3b82f6" strokeWidth={2} />
        <Text style={styles.title}>FitTrainer Pro</Text>
        <Text style={styles.subtitle}>Professional Fitness Management</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.prompt}>Get started by choosing your role</Text>

        <TouchableOpacity
          style={[styles.roleButton, styles.trainerButton]}
          onPress={() => router.push('/(auth)/signup-trainer')}
        >
          <Dumbbell size={28} color="#fff" strokeWidth={2} />
          <View style={styles.buttonTextContainer}>
            <Text style={styles.roleButtonTitle}>Sign up as Trainer</Text>
            <Text style={styles.roleButtonSubtitle}>
              Manage clients and sessions
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, styles.clientButton]}
          onPress={() => router.push('/(auth)/signup-client')}
        >
          <Users size={28} color="#fff" strokeWidth={2} />
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
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  prompt: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 32,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  trainerButton: {
    backgroundColor: '#3b82f6',
  },
  clientButton: {
    backgroundColor: '#10b981',
  },
  buttonTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  roleButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  roleButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  loginText: {
    fontSize: 16,
    color: '#64748b',
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
});
