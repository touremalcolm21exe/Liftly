import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { X, User, MapPin, Clock, ChevronDown, Timer } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (clientId: string, clientName: string, location: string, duration: number) => void;
  selectedDate: Date;
  selectedTime: string;
  clients: Array<{ id: string; name: string }>;
}

export default function BookingModal({ visible, onClose, onConfirm, selectedDate, selectedTime, clients }: BookingModalProps) {
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState('60');
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [previousLocations, setPreviousLocations] = useState<string[]>([]);

  const commonDurations = [30, 45, 60, 90, 120];

  useEffect(() => {
    if (visible) {
      loadPreviousLocations();
    }
  }, [visible]);

  const loadPreviousLocations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: trainer } = await supabase
      .from('trainers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!trainer) return;

    const { data: trainerClients } = await supabase
      .from('clients')
      .select('id')
      .eq('trainer_id', trainer.id);

    if (!trainerClients || trainerClients.length === 0) return;

    const clientIds = trainerClients.map(c => c.id);

    const { data: sessions } = await supabase
      .from('sessions')
      .select('location')
      .in('client_id', clientIds)
      .not('location', 'is', null)
      .order('created_at', { ascending: false });

    if (sessions) {
      const uniqueLocations = Array.from(new Set(sessions.map(s => s.location).filter(Boolean)));
      setPreviousLocations(uniqueLocations.slice(0, 10));
    }
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    const ampm = endHours >= 12 ? 'PM' : 'AM';
    const displayHour = endHours % 12 || 12;
    return `${displayHour}:${String(endMinutes).padStart(2, '0')} ${ampm}`;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleConfirm = () => {
    const durationNum = parseInt(duration);
    if (clientId && clientName.trim() && location.trim() && durationNum > 0) {
      onConfirm(clientId, clientName, location, durationNum);
      setClientId('');
      setClientName('');
      setLocation('');
      setDuration('60');
    }
  };

  const handleClientSelect = (id: string, name: string) => {
    setClientId(id);
    setClientName(name);
    setShowClientPicker(false);
  };

  const handleLocationSelect = (loc: string) => {
    setLocation(loc);
    setShowLocationPicker(false);
  };

  const handleDurationSelect = (mins: number) => {
    setDuration(mins.toString());
    setShowDurationPicker(false);
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
            <Text style={styles.title}>Book Session</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#ffffff" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.dateTimeInfo}>
            <View style={styles.infoRow}>
              <Clock size={20} color="#1a8dff" strokeWidth={2} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Date & Time</Text>
                <Text style={styles.infoValue}>{formatDate(selectedDate)}</Text>
                <Text style={styles.infoValue}>
                  {formatTime(selectedTime)}
                  {duration && parseInt(duration) > 0 && ` - ${calculateEndTime(selectedTime, parseInt(duration))}`}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Client Name <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowClientPicker(!showClientPicker)}
              >
                <User size={20} color="#5b6f92" strokeWidth={2} />
                <Text style={[styles.inputText, !clientName && styles.placeholder]}>
                  {clientName || 'Select or enter client name'}
                </Text>
              </TouchableOpacity>

              {showClientPicker && (
                <View style={styles.clientPicker}>
                  {clients.map((client) => (
                    <TouchableOpacity
                      key={client.id}
                      style={styles.clientOption}
                      onPress={() => handleClientSelect(client.id, client.name)}
                    >
                      <Text style={styles.clientOptionText}>{client.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Duration <Text style={styles.required}>*</Text></Text>
              <View style={styles.durationInputContainer}>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDurationPicker(!showDurationPicker)}
                >
                  <Timer size={20} color="#5b6f92" strokeWidth={2} />
                  <Text style={[styles.inputText, !duration && styles.placeholder]}>
                    {duration ? `${duration} minutes` : 'Select duration'}
                  </Text>
                  <ChevronDown size={20} color="#5b6f92" strokeWidth={2} />
                </TouchableOpacity>

                {showDurationPicker && (
                  <View style={styles.durationPicker}>
                    <Text style={styles.pickerTitle}>Common Durations</Text>
                    {commonDurations.map((mins) => (
                      <TouchableOpacity
                        key={mins}
                        style={[
                          styles.durationOption,
                          duration === mins.toString() && styles.durationOptionSelected
                        ]}
                        onPress={() => handleDurationSelect(mins)}
                      >
                        <Text style={[
                          styles.durationOptionText,
                          duration === mins.toString() && styles.durationOptionTextSelected
                        ]}>
                          {mins} minutes
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <View style={styles.divider} />
                    <View style={styles.customDurationContainer}>
                      <Text style={styles.customDurationLabel}>Custom Duration</Text>
                      <View style={styles.customDurationInput}>
                        <TextInput
                          style={styles.customDurationTextInput}
                          placeholder="Enter minutes"
                          placeholderTextColor="#5b6f92"
                          value={duration}
                          onChangeText={setDuration}
                          keyboardType="numeric"
                          onSubmitEditing={() => setShowDurationPicker(false)}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location <Text style={styles.required}>*</Text></Text>
              <View style={styles.locationInputContainer}>
                <View style={styles.locationInputWrapper}>
                  <MapPin size={20} color="#5b6f92" strokeWidth={2} />
                  <TextInput
                    style={styles.locationInput}
                    placeholder="Enter address or location..."
                    placeholderTextColor="#5b6f92"
                    value={location}
                    onChangeText={setLocation}
                    onFocus={() => setShowLocationPicker(false)}
                  />
                  {previousLocations.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setShowLocationPicker(!showLocationPicker)}
                      style={styles.dropdownButton}
                    >
                      <ChevronDown size={20} color="#5b6f92" strokeWidth={2} />
                    </TouchableOpacity>
                  )}
                </View>

                {showLocationPicker && previousLocations.length > 0 && (
                  <View style={styles.locationPicker}>
                    <Text style={styles.pickerTitle}>Recent Locations</Text>
                    {previousLocations.map((loc, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.locationOption}
                        onPress={() => handleLocationSelect(loc)}
                      >
                        <MapPin size={16} color="#5b6f92" strokeWidth={2} />
                        <Text style={styles.locationOptionText}>{loc}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, (!clientId || !clientName || !location || !duration || parseInt(duration) <= 0) && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={!clientId || !clientName || !location || !duration || parseInt(duration) <= 0}
            >
              <Text style={styles.confirmButtonText}>Book Session</Text>
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
    maxHeight: '90%',
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
  dateTimeInfo: {
    padding: 20,
    backgroundColor: '#050814',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#5b6f92',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  required: {
    color: '#ff4757',
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#050814',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    gap: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  placeholder: {
    color: '#5b6f92',
  },
  clientPicker: {
    marginTop: 8,
    backgroundColor: '#050814',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  clientOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  clientOptionText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 8,
  },
  clientInput: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  locationInputContainer: {
    position: 'relative',
  },
  locationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#050814',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    paddingVertical: 4,
  },
  dropdownButton: {
    padding: 4,
  },
  locationPicker: {
    marginTop: 8,
    backgroundColor: '#050814',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  pickerTitle: {
    fontSize: 12,
    color: '#5b6f92',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  locationOptionText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  durationInputContainer: {
    position: 'relative',
  },
  durationPicker: {
    marginTop: 8,
    backgroundColor: '#050814',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  durationOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  durationOptionSelected: {
    backgroundColor: 'rgba(26, 141, 255, 0.15)',
  },
  durationOptionText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  durationOptionTextSelected: {
    color: '#1a8dff',
    fontWeight: '700',
  },
  customDurationContainer: {
    marginTop: 8,
  },
  customDurationLabel: {
    fontSize: 12,
    color: '#5b6f92',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  customDurationInput: {
    backgroundColor: '#0b0f1e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  customDurationTextInput: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#1a8dff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: 'rgba(26, 141, 255, 0.3)',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
});
