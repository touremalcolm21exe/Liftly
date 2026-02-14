import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Clock, MapPin } from 'lucide-react-native';
import Calendar from '@/components/Calendar';
import SessionDetailsModal from '@/components/SessionDetailsModal';
import { supabase } from '@/lib/supabase';

interface Session {
  id: string;
  client_name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsMap, setSessionsMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

  const loadSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: trainer } = await supabase
        .from('trainers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!trainer) {
        setLoading(false);
        return;
      }

      const { data: clientsList } = await supabase
        .from('clients')
        .select('id')
        .eq('trainer_id', trainer.id);

      if (!clientsList || clientsList.length === 0) {
        setLoading(false);
        return;
      }

      const clientIds = clientsList.map(c => c.id);

      const { data: sessionsList } = await supabase
        .from('sessions')
        .select('*')
        .in('client_id', clientIds)
        .order('start_time');

      if (sessionsList) {
        setSessions(sessionsList);
        updateSessionsMap(sessionsList);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSessionsMap = (sessionsList: Session[]) => {
    const map = new Map<string, number>();
    sessionsList.forEach((session) => {
      const count = map.get(session.date) || 0;
      map.set(session.date, count + 1);
    });
    setSessionsMap(map);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleMonthChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddSession = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    router.push(`/new-session?date=${dateStr}`);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  const getSelectedDateSessions = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return sessions.filter(s => s.date === dateStr && s.status === 'scheduled');
  };

  const handleSessionClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedSessionId(null);
  };

  const handleDeleteSession = () => {
    loadSessions();
  };

  const daysSessions = getSelectedDateSessions();

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1a8dff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Calendar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
          sessionsMap={sessionsMap}
        />

        <View style={styles.selectedDateSection}>
          <View style={styles.selectedDateHeader}>
            <View style={styles.selectedDateInfo}>
              <Text style={styles.selectedDateDay}>{selectedDate.getDate()}</Text>
              <Text style={styles.selectedDateDayName}>{getDayName(selectedDate)}</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddSession}
            >
              <Plus size={24} color="#ffffff" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {daysSessions.length > 0 ? (
            <View style={styles.sessionsList}>
              {daysSessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionCard}
                  onPress={() => handleSessionClick(session.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionTimeContainer}>
                    <Text style={styles.sessionTime}>
                      {formatTime(session.start_time)}
                    </Text>
                  </View>
                  <View style={styles.sessionColorBar} />
                  <View style={styles.sessionDetails}>
                    <Text style={styles.sessionClient}>{session.client_name}</Text>
                    <View style={styles.sessionMeta}>
                      <Clock size={14} color="#5b6f92" strokeWidth={2} />
                      <Text style={styles.sessionMetaText}>
                        {formatTime(session.start_time)} - {formatTime(session.end_time)}
                      </Text>
                    </View>
                    <View style={styles.sessionMeta}>
                      <MapPin size={14} color="#5b6f92" strokeWidth={2} />
                      <Text style={styles.sessionMetaText}>{session.location}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No sessions scheduled</Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleAddSession}
              >
                <Text style={styles.emptyStateButtonText}>Add Session</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <SessionDetailsModal
        visible={showDetailsModal}
        sessionId={selectedSessionId}
        onClose={handleCloseModal}
        onDelete={handleDeleteSession}
      />
    </View>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  selectedDateSection: {
    marginTop: 32,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  selectedDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedDateDay: {
    fontSize: 48,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -1,
  },
  selectedDateDayName: {
    fontSize: 16,
    color: '#5b6f92',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: '#1a8dff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionsList: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: '#0b0f1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  sessionTimeContainer: {
    minWidth: 60,
  },
  sessionTime: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  sessionColorBar: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: '#1a8dff',
    borderRadius: 2,
  },
  sessionDetails: {
    flex: 1,
    gap: 8,
  },
  sessionClient: {
    fontSize: 17,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionMetaText: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#5b6f92',
    fontWeight: '500',
  },
  emptyStateButton: {
    backgroundColor: '#1a8dff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});
