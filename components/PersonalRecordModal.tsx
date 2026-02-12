import { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { X, Save } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface PersonalRecordModalProps {
  visible: boolean;
  clientId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function PersonalRecordModal({ visible, clientId, onClose, onSave }: PersonalRecordModalProps) {
  const [exerciseName, setExerciseName] = useState('');
  const [recordType, setRecordType] = useState('1RM');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('lbs');
  const [achievedDate, setAchievedDate] = useState(new Date().toISOString().split('T')[0]);
  const [previousValue, setPreviousValue] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!exerciseName || !value) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('personal_records')
        .insert({
          client_id: clientId,
          exercise_name: exerciseName.trim(),
          record_type: recordType,
          value: parseFloat(value),
          unit: unit,
          achieved_date: achievedDate,
          previous_value: previousValue ? parseFloat(previousValue) : null,
          notes: notes || null,
        });

      if (!error) {
        setExerciseName('');
        setRecordType('1RM');
        setValue('');
        setUnit('lbs');
        setAchievedDate(new Date().toISOString().split('T')[0]);
        setPreviousValue('');
        setNotes('');
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error saving PR:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setExerciseName('');
    setRecordType('1RM');
    setValue('');
    setUnit('lbs');
    setAchievedDate(new Date().toISOString().split('T')[0]);
    setPreviousValue('');
    setNotes('');
    onClose();
  };

  const recordTypes = ['1RM', '3RM', '5RM', '10RM', 'Max Reps', 'Distance', 'Time'];
  const units = ['lbs', 'kg', 'reps', 'miles', 'km', 'meters', 'minutes', 'seconds'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Log Personal Record</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#ffffff" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.section}>
              <Text style={styles.label}>Exercise Name</Text>
              <TextInput
                style={styles.input}
                value={exerciseName}
                onChangeText={setExerciseName}
                placeholder="e.g., Squat, Bench Press, Deadlift"
                placeholderTextColor="#5b6f92"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Record Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {recordTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.chip, recordType === type && styles.chipActive]}
                    onPress={() => setRecordType(type)}
                  >
                    <Text style={[styles.chipText, recordType === type && styles.chipTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Value & Unit</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.flex2]}
                  value={value}
                  onChangeText={setValue}
                  placeholder="e.g., 315"
                  placeholderTextColor="#5b6f92"
                  keyboardType="decimal-pad"
                />
                <View style={[styles.input, styles.flex1, styles.unitPicker]}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {units.map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.unitChip, unit === u && styles.unitChipActive]}
                        onPress={() => setUnit(u)}
                      >
                        <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Date Achieved</Text>
              <TextInput
                style={styles.input}
                value={achievedDate}
                onChangeText={setAchievedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#5b6f92"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Previous PR (optional)</Text>
              <TextInput
                style={styles.input}
                value={previousValue}
                onChangeText={setPreviousValue}
                placeholder="Previous best"
                placeholderTextColor="#5b6f92"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={styles.textArea}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any notes about this PR..."
                placeholderTextColor="#5b6f92"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Save size={20} color="#ffffff" strokeWidth={2} />
                  <Text style={styles.saveButtonText}>Save PR</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#02040a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  input: {
    backgroundColor: '#050814',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#050814',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    minHeight: 80,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chip: {
    backgroundColor: '#050814',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#1a8dff',
    borderColor: '#1a8dff',
  },
  chipText: {
    fontSize: 14,
    color: '#c8cfdd',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  unitPicker: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  unitChipActive: {
    backgroundColor: 'rgba(26, 141, 255, 0.2)',
  },
  unitChipText: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '600',
  },
  unitChipTextActive: {
    color: '#1a8dff',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  saveButton: {
    backgroundColor: '#1a8dff',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
