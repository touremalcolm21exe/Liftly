import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Client {
  id: string;
  name: string;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
}

export default function NewSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTimeValue, setStartTimeValue] = useState('9:00');
  const [startTimePeriod, setStartTimePeriod] = useState<'AM' | 'PM'>('AM');
  const [endTimeValue, setEndTimeValue] = useState('10:00');
  const [endTimePeriod, setEndTimePeriod] = useState<'AM' | 'PM'>('AM');
  const [sessionName, setSessionName] = useState('');
  const [clientId, setClientId] = useState('');
  const [location, setLocation] = useState('');
  const [workoutTemplateId, setWorkoutTemplateId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
  const [workoutSearchQuery, setWorkoutSearchQuery] = useState('');
  const [startTimeError, setStartTimeError] = useState('');
  const [endTimeError, setEndTimeError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();

    if (params.date) {
      const dateParam = Array.isArray(params.date) ? params.date[0] : params.date;
      setSelectedDate(new Date(dateParam + 'T00:00:00'));
    }
  }, [params.date]);

  const loadData = async () => {
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

      const [clientsResult, templatesResult] = await Promise.all([
        supabase
          .from('clients')
          .select('id, name')
          .eq('trainer_id', trainer.id)
          .order('name'),
        supabase
          .from('workout_templates')
          .select('id, name, description')
          .eq('trainer_id', trainer.id)
          .order('name')
      ]);

      if (clientsResult.data) {
        setClients(clientsResult.data);
      }

      if (templatesResult.data) {
        setWorkoutTemplates(templatesResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
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
    const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])$/;
    return timeRegex.test(time);
  };

  const convertTo24Hour = (timeValue: string, period: 'AM' | 'PM'): string => {
    const match = timeValue.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])$/);
    if (!match) return '';

    let hours = parseInt(match[1]);
    const minutes = match[2];

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  const parseTime = (timeValue: string, period: 'AM' | 'PM'): { hours: number; minutes: number } | null => {
    if (!validateTimeFormat(timeValue)) return null;
    const time24 = convertTo24Hour(timeValue, period);
    const [hours, minutes] = time24.split(':').map(Number);
    return { hours, minutes };
  };

  const handleStartTimeChange = (text: string) => {
    setStartTimeValue(text);
    setStartTimeError('');
  };

  const handleEndTimeChange = (text: string) => {
    setEndTimeValue(text);
    setEndTimeError('');
  };

  const handleStartTimeBlur = () => {
    if (startTimeValue && !validateTimeFormat(startTimeValue)) {
      setStartTimeError('Invalid format. Use H:MM (e.g., 9:00)');
    }
  };

  const handleEndTimeBlur = () => {
    if (endTimeValue && !validateTimeFormat(endTimeValue)) {
      setEndTimeError('Invalid format. Use H:MM (e.g., 6:30)');
    }
  };

  const calculateDuration = (): number | null => {
    const start = parseTime(startTimeValue, startTimePeriod);
    const end = parseTime(endTimeValue, endTimePeriod);

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

    if (!validateTimeFormat(startTimeValue)) {
      setStartTimeError('Invalid format. Use H:MM (e.g., 9:00)');
      hasError = true;
    }

    if (!validateTimeFormat(endTimeValue)) {
      setEndTimeError('Invalid format. Use H:MM (e.g., 6:30)');
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
      const startTime24 = convertTo24Hour(startTimeValue, startTimePeriod);
      const formattedTime = `${startTime24}:00`;
      const endTimeFormatted = calculateEndTime(startTime24, duration);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const finalName = sessionName.trim() || clients.find(c => c.id === clientId)?.name || '';

      const sessionData: any = {
        client_id: clientId,
        client_name: finalName,
        date: dateStr,
        start_time: formattedTime,
        end_time: endTimeFormatted,
        duration_minutes: duration,
        location,
        status: 'scheduled',
      };

      if (workoutTemplateId) {
        sessionData.workout_template_id = workoutTemplateId;
      }

      const { error } = await supabase.from('sessions').insert(sessionData);

      if (!error) {
        router.back();
      }
    } catch (error) {
      console.error('Error saving session:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleClientSelect = (id: string) => {
    setClientId(id);
    const client = clients.find(c => c.id === id);
    if (client && !sessionName) {
      setSessionName(`Session with ${client.name}`);
    }
    setShowClientPicker(false);
  };

  const handleWorkoutSelect = (id: string) => {
    setWorkoutTemplateId(id);
    setShowWorkoutPicker(false);
    setWorkoutSearchQuery('');
  };

  const handleClearWorkout = () => {
    setWorkoutTemplateId('');
  };

  const getFilteredWorkouts = () => {
    if (!workoutSearchQuery.trim()) {
      return workoutTemplates;
    }
    const query = workoutSearchQuery.toLowerCase();
    return workoutTemplates.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        (template.description && template.description.toLowerCase().includes(query))
    );
  };

  const isFormValid = clientId && location.trim() && validateTimeFormat(startTimeValue) && validateTimeFormat(endTimeValue);

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
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>New Session</Text>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <X size={24} color="#ffffff" strokeWidth={2} />
          </TouchableOpacity>
        </View>
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
          <Text style={styles.fieldLabel}>Workout (Optional)</Text>
          {workoutTemplateId ? (
            <View style={styles.selectedWorkoutContainer}>
              <View style={styles.selectedWorkout}>
                <View style={styles.selectedWorkoutInfo}>
                  <Text style={styles.selectedWorkoutName}>
                    {workoutTemplates.find(w => w.id === workoutTemplateId)?.name}
                  </Text>
                  {workoutTemplates.find(w => w.id === workoutTemplateId)?.description && (
                    <Text style={styles.selectedWorkoutDescription}>
                      {workoutTemplates.find(w => w.id === workoutTemplateId)?.description}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.clearWorkoutButton}
                  onPress={handleClearWorkout}
                >
                  <X size={20} color="#5b6f92" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowWorkoutPicker(!showWorkoutPicker)}
            >
              <Text style={[styles.selectButtonText, styles.selectButtonPlaceholder]}>
                Select workout template
              </Text>
            </TouchableOpacity>
          )}

          {showWorkoutPicker && (
            <View style={styles.workoutPickerContainer}>
              <TextInput
                style={styles.workoutSearchInput}
                placeholder="Search workouts..."
                placeholderTextColor="#5b6f92"
                value={workoutSearchQuery}
                onChangeText={setWorkoutSearchQuery}
                autoFocus
              />
              <ScrollView style={styles.workoutPickerList} nestedScrollEnabled>
                {getFilteredWorkouts().length > 0 ? (
                  getFilteredWorkouts().map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      style={styles.workoutPickerOption}
                      onPress={() => handleWorkoutSelect(template.id)}
                    >
                      <Text style={styles.workoutPickerOptionName}>{template.name}</Text>
                      {template.description && (
                        <Text style={styles.workoutPickerOptionDescription}>
                          {template.description}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noWorkoutsContainer}>
                    <Text style={styles.noWorkoutsText}>No workouts found</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.sectionLabel}>Time</Text>

          <View style={styles.timeSection}>
            <Text style={styles.timeLabel}>Start time</Text>
            <View style={styles.timeInputRow}>
              <TextInput
                style={[styles.timeValueInput, startTimeError && styles.timeInputError]}
                placeholder="9:00"
                placeholderTextColor="#5b6f92"
                value={startTimeValue}
                onChangeText={handleStartTimeChange}
                onBlur={handleStartTimeBlur}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
              <View style={styles.periodToggle}>
                <TouchableOpacity
                  style={[
                    styles.periodButton,
                    styles.periodButtonLeft,
                    startTimePeriod === 'AM' && styles.periodButtonActive
                  ]}
                  onPress={() => setStartTimePeriod('AM')}
                >
                  <Text style={[
                    styles.periodButtonText,
                    startTimePeriod === 'AM' && styles.periodButtonTextActive
                  ]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.periodButton,
                    styles.periodButtonRight,
                    startTimePeriod === 'PM' && styles.periodButtonActive
                  ]}
                  onPress={() => setStartTimePeriod('PM')}
                >
                  <Text style={[
                    styles.periodButtonText,
                    startTimePeriod === 'PM' && styles.periodButtonTextActive
                  ]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>
            {startTimeError ? (
              <Text style={styles.errorText}>{startTimeError}</Text>
            ) : null}
          </View>

          <View style={styles.timeSection}>
            <Text style={styles.timeLabel}>End time</Text>
            <View style={styles.timeInputRow}>
              <TextInput
                style={[styles.timeValueInput, endTimeError && styles.timeInputError]}
                placeholder="10:00"
                placeholderTextColor="#5b6f92"
                value={endTimeValue}
                onChangeText={handleEndTimeChange}
                onBlur={handleEndTimeBlur}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
              <View style={styles.periodToggle}>
                <TouchableOpacity
                  style={[
                    styles.periodButton,
                    styles.periodButtonLeft,
                    endTimePeriod === 'AM' && styles.periodButtonActive
                  ]}
                  onPress={() => setEndTimePeriod('AM')}
                >
                  <Text style={[
                    styles.periodButtonText,
                    endTimePeriod === 'AM' && styles.periodButtonTextActive
                  ]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.periodButton,
                    styles.periodButtonRight,
                    endTimePeriod === 'PM' && styles.periodButtonActive
                  ]}
                  onPress={() => setEndTimePeriod('PM')}
                >
                  <Text style={[
                    styles.periodButtonText,
                    endTimePeriod === 'PM' && styles.periodButtonTextActive
                  ]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>
            {endTimeError ? (
              <Text style={styles.errorText}>{endTimeError}</Text>
            ) : null}
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '600',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionLabel: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 16,
  },
  timeSection: {
    marginBottom: 20,
  },
  timeLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
    marginBottom: 12,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeValueInput: {
    flex: 1,
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
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  periodButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonLeft: {
    borderTopLeftRadius: 11,
    borderBottomLeftRadius: 11,
  },
  periodButtonRight: {
    borderTopRightRadius: 11,
    borderBottomRightRadius: 11,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
  },
  periodButtonActive: {
    backgroundColor: '#1a8dff',
  },
  periodButtonText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#ffffff',
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
  selectedWorkoutContainer: {
    marginBottom: 0,
  },
  selectedWorkout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(26, 141, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 141, 255, 0.3)',
  },
  selectedWorkoutInfo: {
    flex: 1,
    marginRight: 12,
  },
  selectedWorkoutName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedWorkoutDescription: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '400',
  },
  clearWorkoutButton: {
    padding: 4,
  },
  workoutPickerContainer: {
    marginTop: 8,
    backgroundColor: '#050814',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    maxHeight: 300,
  },
  workoutSearchInput: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '400',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  workoutPickerList: {
    maxHeight: 240,
  },
  workoutPickerOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  workoutPickerOptionName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutPickerOptionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '400',
  },
  noWorkoutsContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noWorkoutsText: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '500',
  },
});
