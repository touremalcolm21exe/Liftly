import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface Client {
  id: string;
  name: string;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [sessionName, setSessionName] = useState('');
  const [clientId, setClientId] = useState('');
  const [location, setLocation] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [startTimeError, setStartTimeError] = useState('');
  const [endTimeError, setEndTimeError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClients();

    if (params.date) {
      const dateParam = Array.isArray(params.date) ? params.date[0] : params.date;
      setSelectedDate(new Date(dateParam + 'T00:00:00'));
    }
  }, [params.date]);

  const loadClients = async () => {
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
        .select('id, name')
        .eq('trainer_id', trainer.id)
        .order('name');

      if (clientsList) {
        setClients(clientsList);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const calculateEndTime = (startTimeStr: string, durationMinutes: number): string => {
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
  };

  const handleSave = async () => {
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

    setSaving(true);
    try {
      const formattedTime = `${startTime}:00`;
      const endTimeFormatted = calculateEndTime(startTime, duration);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const finalName = sessionName.trim() || clients.find(c => c.id === clientId)?.name || '';

      const { error } = await supabase.from('sessions').insert({
        client_id: clientId,
        client_name: finalName,
        date: dateStr,
        start_time: formattedTime,
        end_time: endTimeFormatted,
        duration_minutes: duration,
        location,
        status: 'scheduled',
      });

      if (!error) {
        resetForm();
        router.back();
      }
    } catch (error) {
      console.error('Error saving session:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    router.back();
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
        <Text style={styles.headerTitle}>Schedule</Text>
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
            (!isFormValid || saving) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!isFormValid || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
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
