import { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { X, Plus, Trash2, Save } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
}

interface WorkoutLogModalProps {
  visible: boolean;
  clientId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function WorkoutLogModal({ visible, clientId, onClose, onSave }: WorkoutLogModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: '1', name: '', sets: '', reps: '', weight: '', notes: '' }
  ]);
  const [saving, setSaving] = useState(false);

  const addExercise = () => {
    setExercises([
      ...exercises,
      { id: Date.now().toString(), name: '', sets: '', reps: '', weight: '', notes: '' }
    ]);
  };

  const removeExercise = (id: string) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter(ex => ex.id !== id));
    }
  };

  const updateExercise = (id: string, field: keyof Exercise, value: string) => {
    setExercises(exercises.map(ex =>
      ex.id === id ? { ...ex, [field]: value } : ex
    ));
  };

  const handleSave = async () => {
    const validExercises = exercises.filter(ex => ex.name.trim() !== '');

    if (validExercises.length === 0) {
      return;
    }

    setSaving(true);
    try {
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          client_id: clientId,
          date: date,
        })
        .select()
        .single();

      if (workoutError || !workout) {
        console.error('Error creating workout:', workoutError);
        setSaving(false);
        return;
      }

      const exerciseRecords = validExercises.map((ex, index) => ({
        workout_id: workout.id,
        exercise_name: ex.name,
        sets: parseInt(ex.sets) || 0,
        reps: parseInt(ex.reps) || 0,
        weight: parseFloat(ex.weight) || 0,
        notes: ex.notes || null,
        order_index: index,
      }));

      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(exerciseRecords);

      if (!exercisesError) {
        setDate(new Date().toISOString().split('T')[0]);
        setExercises([{ id: '1', name: '', sets: '', reps: '', weight: '', notes: '' }]);
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error saving workout:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setExercises([{ id: '1', name: '', sets: '', reps: '', weight: '', notes: '' }]);
    onClose();
  };

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
            <Text style={styles.title}>Log Workout</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#ffffff" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.section}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.dateInput}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#5b6f92"
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>EXERCISES</Text>
                <TouchableOpacity onPress={addExercise} style={styles.addButton}>
                  <Plus size={20} color="#1a8dff" strokeWidth={2} />
                  <Text style={styles.addButtonText}>Add Exercise</Text>
                </TouchableOpacity>
              </View>

              {exercises.map((exercise, index) => (
                <View key={exercise.id} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseNumber}>#{index + 1}</Text>
                    {exercises.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeExercise(exercise.id)}
                        style={styles.removeButton}
                      >
                        <Trash2 size={18} color="#ff4444" strokeWidth={2} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Exercise Name</Text>
                    <TextInput
                      style={styles.input}
                      value={exercise.name}
                      onChangeText={(text) => updateExercise(exercise.id, 'name', text)}
                      placeholder="e.g., Bench Press"
                      placeholderTextColor="#5b6f92"
                    />
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, styles.flex1]}>
                      <Text style={styles.inputLabel}>Sets</Text>
                      <TextInput
                        style={styles.input}
                        value={exercise.sets}
                        onChangeText={(text) => updateExercise(exercise.id, 'sets', text)}
                        placeholder="3"
                        placeholderTextColor="#5b6f92"
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={[styles.inputGroup, styles.flex1]}>
                      <Text style={styles.inputLabel}>Reps</Text>
                      <TextInput
                        style={styles.input}
                        value={exercise.reps}
                        onChangeText={(text) => updateExercise(exercise.id, 'reps', text)}
                        placeholder="10"
                        placeholderTextColor="#5b6f92"
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={[styles.inputGroup, styles.flex1]}>
                      <Text style={styles.inputLabel}>Weight</Text>
                      <TextInput
                        style={styles.input}
                        value={exercise.weight}
                        onChangeText={(text) => updateExercise(exercise.id, 'weight', text)}
                        placeholder="135"
                        placeholderTextColor="#5b6f92"
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                    <TextInput
                      style={styles.textArea}
                      value={exercise.notes}
                      onChangeText={(text) => updateExercise(exercise.id, 'notes', text)}
                      placeholder="Any notes about this exercise..."
                      placeholderTextColor="#5b6f92"
                      multiline
                      numberOfLines={2}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              ))}
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
                  <Text style={styles.saveButtonText}>Save Workout</Text>
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
    maxHeight: '90%',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#5b6f92',
    fontWeight: '700',
    letterSpacing: 1,
  },
  label: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  dateInput: {
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    color: '#1a8dff',
    fontWeight: '600',
  },
  exerciseCard: {
    backgroundColor: '#050814',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  exerciseNumber: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: '#5b6f92',
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  input: {
    backgroundColor: '#02040a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#02040a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    minHeight: 60,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
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
