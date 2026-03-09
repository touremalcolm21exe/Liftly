import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Users, Calendar, Dumbbell, TrendingUp, Clock, MapPin } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useCallback } from 'react';
import { useTheme } from '@/lib/ThemeContext';

interface TodaySession {
  id: string;
  client_name: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  confirmed_by_trainer: boolean;
  completed_at: string | null;
}

interface CurrentSession extends TodaySession {
  client_id: string;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const [totalSessions, setTotalSessions] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([]);
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadTodaySessions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTodaySessions();

      // Set up interval to check for current session every 30 seconds
      const interval = setInterval(() => {
        loadTodaySessions();
      }, 30000);

      setRefreshInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }, [])
  );

  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  const getCurrentTime = (): string => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  const findCurrentSession = (sessions: TodaySession[]): CurrentSession | null => {
    const currentTime = getCurrentTime();

    const scheduledSessions = sessions.filter(s =>
      s.status === 'scheduled' && !(s.confirmed_by_trainer && s.completed_at)
    );

    // Find session that is currently in progress (start <= now <= end)
    const inProgressSession = scheduledSessions.find(s => {
      return s.start_time <= currentTime && s.end_time > currentTime;
    });

    if (inProgressSession) {
      console.log(`Current session in progress: ${inProgressSession.id} (${inProgressSession.client_name})`);
      return inProgressSession as CurrentSession;
    }

    // If no in-progress session, find the next upcoming session
    const nextSession = scheduledSessions.find(s => s.start_time > currentTime);

    if (nextSession) {
      console.log(`Next upcoming session: ${nextSession.id} (${nextSession.client_name})`);
      return nextSession as CurrentSession;
    }

    return null;
  };

  const loadTodaySessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const role = user.user_metadata?.role;
      setUserRole(role);

      const { data: trainer } = await supabase
        .from('trainers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!trainer) return;

      const today = new Date().toISOString().split('T')[0];

      const { data: clientsList } = await supabase
        .from('clients')
        .select('id')
        .eq('trainer_id', trainer.id);

      if (!clientsList || clientsList.length === 0) return;

      const clientIds = clientsList.map(c => c.id);

      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, client_id, client_name, start_time, end_time, location, status, confirmed_by_trainer, completed_at')
        .eq('date', today)
        .in('client_id', clientIds)
        .order('start_time');

      if (sessions) {
        setTodaySessions(sessions);
        setTotalSessions(sessions.length);
        setCompletedSessions(sessions.filter(s => s.status === 'completed').length);

        // Find current session
        const current = findCurrentSession(sessions);
        setCurrentSession(current);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const progress = totalSessions > 0 ? completedSessions / totalSessions : 0;
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference * (1 - progress);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const remainingSessions = totalSessions - completedSessions;
  const progressPercentage = totalSessions > 0 ? Math.round(progress * 100) : 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>Good morning</Text>
        <Text style={[styles.title, { color: colors.text }]}>Today's Schedule</Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.heroContent}>
          <View style={styles.progressContainer}>
            <Svg width={140} height={140}>
              <Circle
                cx={70}
                cy={70}
                r={60}
                stroke={colors.border}
                strokeWidth={8}
                fill="none"
              />
              <Circle
                cx={70}
                cy={70}
                r={60}
                stroke={colors.primary}
                strokeWidth={8}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 70 70)`}
              />
            </Svg>
            <View style={styles.progressText}>
              <Text style={[styles.progressNumber, { color: colors.text }]}>{progressPercentage}%</Text>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Complete</Text>
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{totalSessions}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sessions</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{remainingSessions}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Remaining</Text>
            </View>
          </View>
        </View>
      </View>

      {currentSession && (
        <View style={styles.currentWorkoutSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Workout</Text>
          <TouchableOpacity
            style={styles.currentWorkoutCard}
            onPress={() => router.push(`/current-workout?sessionId=${currentSession.id}`)}
            activeOpacity={0.8}
          >
            <View style={styles.currentWorkoutContent}>
              <View style={styles.currentWorkoutHeader}>
                <View style={styles.currentWorkoutIconContainer}>
                  <Dumbbell size={28} color={colors.primary} strokeWidth={2.5} />
                </View>
                <View style={styles.currentWorkoutInfo}>
                  <Text style={[styles.currentWorkoutClient, { color: colors.text }]}>{currentSession.client_name}</Text>
                  <View style={styles.currentWorkoutDetails}>
                    <Clock size={14} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={[styles.currentWorkoutTime, { color: colors.textSecondary }]}>
                      {formatTime(currentSession.start_time)} - {formatTime(currentSession.end_time)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={[styles.currentWorkoutBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.currentWorkoutBadgeText}>Track Workout</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

{todaySessions.filter(session => !(session.confirmed_by_trainer && session.completed_at) && session.id !== currentSession?.id).length > 0 && (
        <View style={styles.sessionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Sessions</Text>
          {todaySessions
            .filter(session => !(session.confirmed_by_trainer && session.completed_at) && session.id !== currentSession?.id)
            .map((session) => (
              <TouchableOpacity
                key={session.id}
                style={[styles.sessionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push(`/current-workout?sessionId=${session.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionClientRow}>
                    <Text style={[styles.sessionClient, { color: colors.text }]}>
                      {session.client_name}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={[styles.statusText, { color: colors.primary }]}>
                      Scheduled
                    </Text>
                  </View>
                </View>
                <View style={styles.sessionDetails}>
                  <View style={styles.sessionDetail}>
                    <Clock size={16} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={[styles.sessionDetailText, { color: colors.textSecondary }]}>
                      {formatTime(session.start_time)} - {formatTime(session.end_time)}
                    </Text>
                  </View>
                  <View style={styles.sessionDetail}>
                    <MapPin size={16} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={[styles.sessionDetailText, { color: colors.textSecondary }]}>
                      {session.location}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
        </View>
      )}

      <View style={styles.quickActions}>
        <View style={styles.actionRow}>
          {userRole === 'trainer' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              onPress={() => router.push('/clients')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIcon}>
                <Users size={26} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>Clients</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
            onPress={() => router.push('/schedule')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Calendar size={26} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
            onPress={() => router.push('/workouts')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Dumbbell size={26} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Workouts</Text>
          </TouchableOpacity>
        </View>

        {userRole === 'trainer' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              onPress={() => router.push('/stats')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIcon}>
                <TrendingUp size={26} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>Stats</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02040a',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
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
  currentWorkoutSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  currentWorkoutCard: {
    backgroundColor: 'rgba(26, 141, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(26, 141, 255, 0.3)',
    padding: 20,
  },
  currentWorkoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentWorkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  currentWorkoutIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(26, 141, 255, 0.15)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentWorkoutInfo: {
    flex: 1,
    gap: 6,
  },
  currentWorkoutClient: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  currentWorkoutDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentWorkoutTime: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '600',
  },
  currentWorkoutBadge: {
    backgroundColor: '#1a8dff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  currentWorkoutBadgeText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.3,
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
    padding: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  actionIcon: {
    marginBottom: 10,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  sessionsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  sessionCard: {
    backgroundColor: '#0b0f1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sessionClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionClient: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  statusBadge: {
    backgroundColor: 'rgba(26, 141, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#1a8dff',
    fontWeight: '600',
  },
  sessionDetails: {
    gap: 8,
  },
  sessionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionDetailText: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '500',
  },
});
