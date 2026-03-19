import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Dumbbell, User } from 'lucide-react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Dumbbell size={64} color="#1a8dff" strokeWidth={2} />
        <Text style={styles.title}>Liftly</Text>
        <Text style={styles.subtitle}>Transform Your Fitness Journey</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.prompt}>Choose your account type</Text>

        <View style={styles.roleCard}>
          <View style={styles.roleHeader}>
            <View style={styles.trainerIconContainer}>
              <Dumbbell size={32} color="#1a8dff" strokeWidth={2.5} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>Trainer</Text>
              <Text style={styles.roleDescription}>Manage clients and programs</Text>
            </View>
          </View>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={styles.trainerButton}
              onPress={() => router.push('/(auth)/login-trainer')}
              activeOpacity={0.7}
            >
              <Text style={styles.trainerButtonText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.trainerOutlineButton}
              onPress={() => router.push('/(auth)/signup-trainer')}
              activeOpacity={0.7}
            >
              <Text style={styles.trainerOutlineButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.roleCard}>
          <View style={styles.roleHeader}>
            <View style={styles.clientIconContainer}>
              <User size={32} color="#10b981" strokeWidth={2.5} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>Client</Text>
              <Text style={styles.roleDescription}>Track your fitness journey</Text>
            </View>
          </View>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={styles.clientButton}
              onPress={() => router.push('/(auth)/login-client')}
              activeOpacity={0.7}
            >
              <Text style={styles.clientButtonText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.clientOutlineButton}
              onPress={() => router.push('/(auth)/signup-client')}
              activeOpacity={0.7}
            >
              <Text style={styles.clientOutlineButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: 40,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -0.3,
  },
  roleCard: {
    backgroundColor: '#0b0f1e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trainerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(26, 141, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(26, 141, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  clientIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  roleDescription: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '600',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  trainerButton: {
    flex: 1,
    backgroundColor: '#1a8dff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  trainerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  trainerOutlineButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#1a8dff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  trainerOutlineButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a8dff',
    letterSpacing: -0.2,
  },
  clientButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  clientButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  clientOutlineButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  clientOutlineButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: -0.2,
  },
});
