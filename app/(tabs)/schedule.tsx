import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Plus } from 'lucide-react-native';
import Calendar from '@/components/Calendar';
import DailyTimeSlots from '@/components/DailyTimeSlots';
import BookingModal from '@/components/BookingModal';
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

interface Client {
  id: string;
  name: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  session?: Session;
}

export default function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sessionsMap, setSessionsMap] = useState<Map<string, number>>(new Map());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'daily'>('calendar');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    generateTimeSlots();
  }, [selectedDate, sessions]);

  const loadData = async () => {
    try {
      const [sessionsResponse, clientsResponse] = await Promise.all([
        supabase.from('sessions').select('*').eq('status', 'scheduled'),
        supabase.from('clients').select('id, name').order('name'),
      ]);

      if (sessionsResponse.data) {
        setSessions(sessionsResponse.data);
        updateSessionsMap(sessionsResponse.data);
      }

      if (clientsResponse.data) {
        setClients(clientsResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
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

  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const daysSessions = sessions.filter((s) => s.date === selectedDateStr);

    const businessHours = [
      '09:00:00', '10:00:00', '11:00:00', '14:00:00',
      '15:00:00', '16:00:00', '17:00:00', '18:00:00'
    ];

    businessHours.forEach((time) => {
      const existingSession = daysSessions.find((s) => s.start_time === time);
      if (existingSession) {
        slots.push({
          time,
          available: false,
          session: existingSession,
        });
      } else {
        slots.push({
          time,
          available: true,
        });
      }
    });

    setTimeSlots(slots);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setViewMode('daily');
  };

  const handleSlotPress = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  const handleSessionPress = (session: Session) => {
    setSelectedSession(session);
    setShowSessionModal(true);
  };

  const handleBookSession = async (clientName: string, location: string) => {
    if (!selectedSlot) return;

    try {
      const endTime = calculateEndTime(selectedSlot.time, 60);
      const dateStr = selectedDate.toISOString().split('T')[0];

      const { error } = await supabase.from('sessions').insert({
        client_name: clientName,
        date: dateStr,
        start_time: selectedSlot.time,
        end_time: endTime,
        duration_minutes: 60,
        location,
        status: 'scheduled',
      });

      if (!error) {
        await loadData();
        setShowBookingModal(false);
        setSelectedSlot(null);
      }
    } catch (error) {
      console.error('Error booking session:', error);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('id', sessionId);

      if (!error) {
        await loadData();
      }
    } catch (error) {
      console.error('Error canceling session:', error);
    }
  };

  const handleRescheduleSession = (sessionId: string) => {
    setShowSessionModal(false);
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
  };

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
        {viewMode === 'daily' && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setViewMode('calendar')}
          >
            <Text style={styles.backButtonText}>Calendar</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {viewMode === 'calendar' ? (
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onMonthChange={setSelectedDate}
            sessionsMap={sessionsMap}
          />
        ) : (
          <DailyTimeSlots
            selectedDate={selectedDate}
            timeSlots={timeSlots}
            onSlotPress={handleSlotPress}
            onSessionPress={handleSessionPress}
          />
        )}
      </ScrollView>

      <BookingModal
        visible={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedSlot(null);
        }}
        onConfirm={handleBookSession}
        selectedDate={selectedDate}
        selectedTime={selectedSlot?.time || ''}
        clients={clients}
      />

      <SessionDetailsModal
        visible={showSessionModal}
        onClose={() => {
          setShowSessionModal(false);
          setSelectedSession(null);
        }}
        session={selectedSession}
        onReschedule={handleRescheduleSession}
        onCancel={handleCancelSession}
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
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  backButton: {
    backgroundColor: '#1a8dff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
