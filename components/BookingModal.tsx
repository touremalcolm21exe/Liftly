import { useState, useEffect, useRef } from 'react';
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
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(10);
  const [endMinute, setEndMinute] = useState(0);
  const [sessionName, setSessionName] = useState('');
  const [clientId, setClientId] = useState('');
  const [location, setLocation] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(false);

  const startHourScrollRef = useRef<ScrollView>(null);
  const startMinuteScrollRef = useRef<ScrollView>(null);
  const endHourScrollRef = useRef<ScrollView>(null);
  const endMinuteScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      setStartHour(hours);
      setStartMinute(minutes);
      setEndHour((hours + 1) % 24);
      setEndMinute(minutes);
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

  const calculateDuration = () => {
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    let duration = endMinutes - startMinutes;

    if (duration < 0) {
      duration += 24 * 60;
    }

    return duration;
  };

  const handleConfirm = () => {
    if (!clientId || !location.trim()) return;

    const formattedTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00`;
    const finalName = sessionName.trim() || clients.find(c => c.id === clientId)?.name || '';
    const duration = calculateDuration();

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
  };

  const handleClientSelect = (id: string) => {
    setClientId(id);
    const client = clients.find(c => c.id === id);
    if (client && !sessionName) {
      setSessionName(`Session with ${client.name}`);
    }
    setShowClientPicker(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const TimePickerColumn = ({
    value,
    onValueChange,
    items,
    scrollRef
  }: {
    value: number;
    onValueChange: (val: number) => void;
    items: number[];
    scrollRef: React.RefObject<ScrollView | null>;
  }) => (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      snapToInterval={60}
      decelerationRate="fast"
      contentContainerStyle={styles.scrollContent}
    >
      {items.map((item) => (
        <TouchableOpacity
          key={item}
          style={styles.timeItem}
          onPress={() => onValueChange(item)}
        >
          <Text style={[
            styles.timeText,
            item === value && styles.timeTextSelected
          ]}>
            {String(item).padStart(2, '0')}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

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

            <View style={styles.timePickerGroup}>
              <Text style={styles.fieldLabel}>Start time</Text>
              <View style={styles.timePickerContainer}>
                <TimePickerColumn
                  value={startHour}
                  onValueChange={setStartHour}
                  items={hours}
                  scrollRef={startHourScrollRef}
                />
                <Text style={styles.timePickerSeparator}>:</Text>
                <TimePickerColumn
                  value={startMinute}
                  onValueChange={setStartMinute}
                  items={minutes}
                  scrollRef={startMinuteScrollRef}
                />
              </View>
            </View>

            <View style={styles.timePickerGroup}>
              <Text style={styles.fieldLabel}>End time</Text>
              <View style={styles.timePickerContainer}>
                <TimePickerColumn
                  value={endHour}
                  onValueChange={setEndHour}
                  items={hours}
                  scrollRef={endHourScrollRef}
                />
                <Text style={styles.timePickerSeparator}>:</Text>
                <TimePickerColumn
                  value={endMinute}
                  onValueChange={setEndMinute}
                  items={minutes}
                  scrollRef={endMinuteScrollRef}
                />
              </View>
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
                (!clientId || !location.trim()) && styles.saveButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={!clientId || !location.trim()}
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
  timePickerGroup: {
    marginBottom: 24,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingVertical: 60,
  },
  timeItem: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  timeText: {
    fontSize: 40,
    color: '#2a3448',
    fontWeight: '300',
  },
  timeTextSelected: {
    fontSize: 52,
    color: '#ffffff',
    fontWeight: '300',
  },
  timePickerSeparator: {
    fontSize: 52,
    color: '#ffffff',
    fontWeight: '300',
    marginHorizontal: 8,
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
