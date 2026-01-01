import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Users, Calendar, Dumbbell, TrendingUp } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';

export default function HomeScreen() {
  const progress = 0.65;
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning</Text>
        <Text style={styles.title}>Today's Schedule</Text>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroContent}>
          <View style={styles.progressContainer}>
            <Svg width={140} height={140}>
              <Circle
                cx={70}
                cy={70}
                r={60}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={8}
                fill="none"
              />
              <Circle
                cx={70}
                cy={70}
                r={60}
                stroke="#1a8dff"
                strokeWidth={8}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 70 70)`}
              />
            </Svg>
            <View style={styles.progressText}>
              <Text style={styles.progressNumber}>65%</Text>
              <Text style={styles.progressLabel}>Complete</Text>
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/clients')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Users size={32} color="#1a8dff" strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel}>Clients</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/schedule')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Calendar size={32} color="#1a8dff" strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel}>Schedule</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/clients')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Dumbbell size={32} color="#1a8dff" strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel}>Workouts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/stats')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <TrendingUp size={32} color="#1a8dff" strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel}>Stats</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02040a',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  heroCard: {
    backgroundColor: '#0b0f1e',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 32,
    marginBottom: 32,
  },
  heroContent: {
    alignItems: 'center',
  },
  progressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressNumber: {
    fontSize: 36,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -1,
  },
  progressLabel: {
    fontSize: 13,
    color: '#5b6f92',
    fontWeight: '600',
    marginTop: 2,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    color: '#1a8dff',
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: '#5b6f92',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickActions: {
    gap: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#050814',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  actionIcon: {
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
