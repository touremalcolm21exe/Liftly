import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (clientId: string, clientName: string, location: string, duration: number, startTime?: string) => void;
  selectedDate: Date;
  selectedTime: string;
  clients: Array<{ id: string; name: string }>;
}

export default function BookingModal({ visible, onClose, onConfirm, selectedDate, selectedTime, clients }: BookingModalProps) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [sessionName, setSessionName] = useState('');
  const [clientId, setClientId] = useState('');
  const [location, setLocation] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [startTimeError, setStartTimeError] = useState('');
  const [endTimeError, setEndTimeError] = useState('');

  useEffect(() => {
    if (visible && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      setStartTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
      const endHour = (hours + 1) % 24;
      setEndTime(`${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }
  }, [visible, selectedTime]);

  const formatDateDisplay = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = date.getDate();

    if (isToday) {
      return `Today – ${dayName}, ${monthName} ${dayNum}`;
    } else if (isTomorrow) {
      return `Tomorrow – ${dayName}, ${monthName} ${dayNum}`;
    } else {
      return `${dayName}, ${monthName} ${dayNum}`;
    }
  };

  const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(time);
  };

  const parseTime = (time: string): { hours: number; minutes: number } | null => {
    if (!validateTimeFormat(time)) return null;
    const [hours, minutes] = time.split(':').map(Number);
    return { hours, minutes };
  };

  const handleStartTimeChange = (text: string) => {
    setStartTime(text);
    setStartTimeError('');
  };

  const handleEndTimeChange = (text: string) => {
    setEndTime(text);
    setEndTimeError('');
  };

  const handleStartTimeBlur = () => {
    if (startTime && !validateTimeFormat(startTime)) {
      setStartTimeError('Invalid format. Use HH:MM (e.g., 09:00)');
    }
  };

  const handleEndTimeBlur = () => {
    if (endTime && !validateTimeFormat(endTime)) {
      setEndTimeError('Invalid format. Use HH:MM (e.g., 18:30)');
    }
  };

  const calculateDuration = (): number | null => {
    const start = parseTime(startTime);
    const end = parseTime(endTime);

    if (!start || !end) return null;

    const startMinutes = start.hours * 60 + start.minutes;
    const endMinutes = end.hours * 60 + end.minutes;
    let duration = endMinutes - startMinutes;

    if (duration < 0) {
      duration += 24 * 60;
    }

    return duration;
  };

  const handleConfirm = () => {
    let hasError = false;

    if (!validateTimeFormat(startTime)) {
      setStartTimeError('Invalid format. Use HH:MM (e.g., 09:00)');
      hasError = true;
    }

    if (!validateTimeFormat(endTime)) {
      setEndTimeError('Invalid format. Use HH:MM (e.g., 18:30)');
      hasError = true;
    }

    if (hasError || !clientId || !location.trim()) return;

    const duration = calculateDuration();
    if (duration === null || duration <= 0) {
      setEndTimeError('End time must be after start time');
      return;
    }

    const formattedTime = `${startTime}:00`;
    const finalName = sessionName.trim() || clients.find(c => c.id === clientId)?.name || '';

    onConfirm(clientId, finalName, location, duration, formattedTime);
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSessionName('');
    setClientId('');
    setLocation('');
    setShowClientPicker(false);
    setStartTimeError('');
    setEndTimeError('');
  };

  const handleClientSelect = (id: string) => {
    setClientId(id);
    const client = clients.find(c => c.id === id);
    if (client && !sessionName) {
      setSessionName(`Session with ${client.name}`);
    }
    setShowClientPicker(false);
  };

  const isFormValid = clientId && location.trim() && validateTimeFormat(startTime) && validateTimeFormat(endTime);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>New Session</Text>
            <Text style={styles.dateDisplay}>{formatDateDisplay(selectedDate)}</Text>
          </View>

          <ScrollView style={styles.contentSection} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.sessionNameInput}
                placeholder="Session name"
                placeholderTextColor="#5b6f92"
                value={sessionName}
                onChangeText={setSessionName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Client</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowClientPicker(!showClientPicker)}
              >
                <Text style={[
                  styles.selectButtonText,
                  !clientId && styles.selectButtonPlaceholder
                ]}>
                  {clientId ? clients.find(c => c.id === clientId)?.name : 'Select client'}
                </Text>
              </TouchableOpacity>

              {showClientPicker && (
                <View style={styles.pickerDropdown}>
                  {clients.map((client) => (
                    <TouchableOpacity
                      key={client.id}
                      style={styles.pickerOption}
                      onPress={() => handleClientSelect(client.id)}
                    >
                      <Text style={styles.pickerOptionText}>{client.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter location"
                placeholderTextColor="#5b6f92"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Start time</Text>
              <TextInput
                style={[styles.timeInput, startTimeError && styles.timeInputError]}
                placeholder="09:00"
                placeholderTextColor="#5b6f92"
                value={startTime}
                onChangeText={handleStartTimeChange}
                onBlur={handleStartTimeBlur}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
              {startTimeError ? (
                <Text style={styles.errorText}>{startTimeError}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>End time</Text>
              <TextInput
                style={[styles.timeInput, endTimeError && styles.timeInputError]}
                placeholder="18:30"
                placeholderTextColor="#5b6f92"
                value={endTime}
                onChangeText={handleEndTimeChange}
                onBlur={handleEndTimeBlur}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
              {endTimeError ? (
                <Text style={styles.errorText}>{endTimeError}</Text>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                !isFormValid && styles.saveButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={!isFormValid}
            >
              <Text style={styles.saveButtonText}>Save</Text>
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
    backgroundColor: 'rgba(2, 4, 10, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    height: '95%',
    backgroundColor: '#0b0f1e',
    borderRadius: 28,
    overflow: 'hidden',
  },
  header: {
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitle: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
  },
  dateDisplay: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  sessionNameInput: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '400',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  fieldLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
    marginBottom: 12,
  },
  selectButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '400',
  },
  selectButtonPlaceholder: {
    color: '#5b6f92',
  },
  pickerDropdown: {
    marginTop: 8,
    backgroundColor: '#050814',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  pickerOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '400',
  },
  textInput: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '400',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timeInput: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '400',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timeInputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: 8,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  cancelButtonText: {
    fontSize: 17,
    color: '#ffffff',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a8dff',
    borderRadius: 28,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(26, 141, 255, 0.3)',
  },
  saveButtonText: {
    fontSize: 17,
    color: '#ffffff',
    fontWeight: '600',
  },
});
