import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Switch } from 'react-native';
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
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [sessionName, setSessionName] = useState('');
  const [clientId, setClientId] = useState('');
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState(60);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [clientReminder, setClientReminder] = useState(true);
  const [showClientPicker, setShowClientPicker] = useState(false);

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      setHour(hours);
      setMinute(minutes);
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

  const handleConfirm = () => {
    if (!clientId || !location.trim()) return;

    const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
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
    setDuration(60);
    setSoundEnabled(true);
    setVibrationEnabled(true);
    setClientReminder(true);
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

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.timePickerSection}>
            <View style={styles.timeDisplay}>
              <ScrollView
                ref={hourScrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={80}
                decelerationRate="fast"
                contentContainerStyle={styles.scrollContent}
              >
                {hours.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={styles.timeItem}
                    onPress={() => setHour(h)}
                  >
                    <Text style={[
                      styles.timeText,
                      h === hour && styles.timeTextSelected
                    ]}>
                      {String(h).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.timeSeparator}>:</Text>

              <ScrollView
                ref={minuteScrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={80}
                decelerationRate="fast"
                contentContainerStyle={styles.scrollContent}
              >
                {minutes.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={styles.timeItem}
                    onPress={() => setMinute(m)}
                  >
                    <Text style={[
                      styles.timeText,
                      m === minute && styles.timeTextSelected
                    ]}>
                      {String(m).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.dateDisplay}>{formatDateDisplay(selectedDate)}</Text>
          </View>

          <ScrollView style={styles.contentSection}>
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
              <Text style={styles.fieldLabel}>Duration (minutes)</Text>
              <View style={styles.durationButtons}>
                {[30, 45, 60, 90].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.durationButton,
                      duration === d && styles.durationButtonSelected
                    ]}
                    onPress={() => setDuration(d)}
                  >
                    <Text style={[
                      styles.durationButtonText,
                      duration === d && styles.durationButtonTextSelected
                    ]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.toggleSection}>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Sound</Text>
                <Switch
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                  trackColor={{ false: '#1a1f2e', true: '#1a8dff' }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Vibrate</Text>
                <Switch
                  value={vibrationEnabled}
                  onValueChange={setVibrationEnabled}
                  trackColor={{ false: '#1a1f2e', true: '#1a8dff' }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Remind client</Text>
                <Switch
                  value={clientReminder}
                  onValueChange={setClientReminder}
                  trackColor={{ false: '#1a1f2e', true: '#1a8dff' }}
                  thumbColor="#ffffff"
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
  timePickerSection: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 240,
    marginBottom: 16,
  },
  scrollContent: {
    paddingVertical: 80,
  },
  timeItem: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  timeText: {
    fontSize: 56,
    color: '#2a3448',
    fontWeight: '300',
  },
  timeTextSelected: {
    fontSize: 72,
    color: '#ffffff',
    fontWeight: '300',
  },
  timeSeparator: {
    fontSize: 72,
    color: '#ffffff',
    fontWeight: '300',
    marginHorizontal: 8,
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
  durationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  durationButtonSelected: {
    backgroundColor: 'rgba(26, 141, 255, 0.15)',
    borderColor: '#1a8dff',
  },
  durationButtonText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
  },
  durationButtonTextSelected: {
    color: '#1a8dff',
    fontWeight: '600',
  },
  toggleSection: {
    gap: 8,
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '400',
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
