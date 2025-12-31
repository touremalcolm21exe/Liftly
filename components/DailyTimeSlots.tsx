import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Clock, User } from 'lucide-react-native';

interface Session {
  id: string;
  client_name: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  session?: Session;
}

interface DailyTimeSlotsProps {
  selectedDate: Date;
  timeSlots: TimeSlot[];
  onSlotPress: (slot: TimeSlot) => void;
  onSessionPress: (session: Session) => void;
}

export default function DailyTimeSlots({ selectedDate, timeSlots, onSlotPress, onSessionPress }: DailyTimeSlotsProps) {
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateLabel}>SCHEDULE FOR</Text>
        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
      </View>

      <ScrollView style={styles.slotsList} contentContainerStyle={styles.slotsListContent}>
        {timeSlots.map((slot, index) => {
          if (slot.session) {
            return (
              <TouchableOpacity
                key={`session-${slot.session.id}`}
                style={[styles.slotCard, styles.sessionCard]}
                onPress={() => onSessionPress(slot.session!)}
              >
                <View style={styles.timeColumn}>
                  <Text style={styles.timeTextBooked}>{formatTime(slot.time)}</Text>
                  <Clock size={16} color="#1a8dff" strokeWidth={2} />
                </View>
                <View style={styles.sessionDetails}>
                  <View style={styles.sessionHeader}>
                    <View style={styles.clientInfo}>
                      <View style={styles.avatarSmall}>
                        <User size={16} color="#1a8dff" strokeWidth={2} />
                      </View>
                      <Text style={styles.clientNameText}>{slot.session.client_name}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Booked</Text>
                    </View>
                  </View>
                  <Text style={styles.locationText}>{slot.session.location}</Text>
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={`slot-${index}`}
              style={[styles.slotCard, styles.availableCard]}
              onPress={() => onSlotPress(slot)}
            >
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>{formatTime(slot.time)}</Text>
                <Clock size={16} color="#5b6f92" strokeWidth={2} />
              </View>
              <View style={styles.availableContent}>
                <Text style={styles.availableText}>Available</Text>
                <Text style={styles.availableSubtext}>Tap to book</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 12,
    color: '#5b6f92',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  slotsList: {
    flex: 1,
  },
  slotsListContent: {
    paddingBottom: 20,
  },
  slotCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sessionCard: {
    backgroundColor: '#050814',
    borderColor: 'rgba(26, 141, 255, 0.2)',
  },
  availableCard: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderStyle: 'dashed',
  },
  timeColumn: {
    alignItems: 'center',
    marginRight: 16,
    paddingTop: 2,
  },
  timeText: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  timeTextBooked: {
    fontSize: 14,
    color: '#1a8dff',
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(26, 141, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  clientNameText: {
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
    fontSize: 11,
    color: '#1a8dff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 13,
    color: '#5b6f92',
    fontWeight: '600',
  },
  availableContent: {
    flex: 1,
    justifyContent: 'center',
  },
  availableText: {
    fontSize: 16,
    color: '#c8cfdd',
    fontWeight: '600',
    marginBottom: 2,
  },
  availableSubtext: {
    fontSize: 13,
    color: '#5b6f92',
    fontWeight: '500',
  },
});
