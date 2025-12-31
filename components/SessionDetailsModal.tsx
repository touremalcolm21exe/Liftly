import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { X, User, MapPin, Clock, Calendar as CalendarIcon, Trash2 } from 'lucide-react-native';

interface Session {
  id: string;
  client_name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
}

interface SessionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  session: Session | null;
  onReschedule: (sessionId: string) => void;
  onCancel: (sessionId: string) => void;
}

export default function SessionDetailsModal({ visible, onClose, session, onReschedule, onCancel }: SessionDetailsModalProps) {
  if (!session) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleCancelSession = () => {
    Alert.alert(
      'Cancel Session',
      `Are you sure you want to cancel this session with ${session.client_name}?`,
      [
        {
          text: 'No, Keep It',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            onCancel(session.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleReschedule = () => {
    onReschedule(session.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Session Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#ffffff" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.clientSection}>
              <View style={styles.avatar}>
                <User size={32} color="#1a8dff" strokeWidth={2} />
              </View>
              <Text style={styles.clientName}>{session.client_name}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{session.status}</Text>
              </View>
            </View>

            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <CalendarIcon size={20} color="#1a8dff" strokeWidth={2} />
                </View>
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formatDate(session.date)}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Clock size={20} color="#1a8dff" strokeWidth={2} />
                </View>
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(session.start_time)} - {formatTime(session.end_time)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MapPin size={20} color="#1a8dff" strokeWidth={2} />
                </View>
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{session.location}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.rescheduleButton}
              onPress={handleReschedule}
            >
              <CalendarIcon size={20} color="#ffffff" strokeWidth={2} />
              <Text style={styles.rescheduleButtonText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSession}
            >
              <Trash2 size={20} color="#ef4444" strokeWidth={2} />
              <Text style={styles.cancelButtonText}>Cancel Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 4, 10, 0.95)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0b0f1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  clientSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(26, 141, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  clientName: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: 'rgba(26, 141, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#1a8dff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsSection: {
    gap: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 141, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailText: {
    flex: 1,
    paddingTop: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#5b6f92',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  footer: {
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  rescheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a8dff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  rescheduleButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 16,
    gap: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
});
