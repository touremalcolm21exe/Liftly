import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Trash2, Save, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Exercise {
  id?: string;
  exercise_name: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
  order_index: number;
}

interface Session {
  id: string;
  client_id: string;
  client_name: string;
  start_time: string;
  end_time: string;
  date: string;
}

export default function CurrentWorkoutScreen() {
  const { sessionId } = useLocalSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadWorkoutData();
  }, [sessionId]);

  const loadWorkoutData = async () => {
    try {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('id, client_id, client_name, start_time, end_time, date')
        .eq('id', sessionId)
        .maybeSingle();

      if (sessionData) {
        setSession(sessionData);

        const { data: existingWorkout } = await supabase
          .from('workouts')
          .select('id')
          .eq('session_id', sessionId)
          .maybeSingle();

        if (existingWorkout) {
          setWorkoutId(existingWorkout.id);

          const { data: exerciseData } = await supabase
            .from('workout_exercises')
            .select('*')
            .eq('workout_id', existingWorkout.id)
            .order('order_index');

          if (exerciseData) {
            setExercises(exerciseData.map(ex => ({
              id: ex.id,
              exercise_name: ex.exercise_name,
              sets: ex.sets.toString(),
              reps: ex.reps.toString(),
              weight: ex.weight.toString(),
              notes: ex.notes || '',
              order_index: ex.order_index,
            })));
          }
        }
      }
    } catch (error) {
      console.error('Error loading workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExercise = () => {
    const newExercise: Exercise = {
      exercise_name: '',
      sets: '3',
      reps: '10',
      weight: '0',
      notes: '',
      order_index: exercises.length,
    };
    setExercises([...exercises, newExercise]);
  };

  const removeExercise = (index: number) => {
    const newExercises = exercises.filter((_, i) => i !== index);
    setExercises(newExercises.map((ex, i) => ({ ...ex, order_index: i })));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  const saveWorkout = async () => {
    if (!session) return;

    if (exercises.some(ex => !ex.exercise_name.trim())) {
      Alert.alert('Validation Error', 'Please enter a name for all exercises');
      return;
    }

    setSaving(true);
    try {
      let currentWorkoutId = workoutId;

      if (!currentWorkoutId) {
        const { data: newWorkout, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            client_id: session.client_id,
            session_id: session.id,
            date: session.date,
          })
          .select('id')
          .single();

        if (workoutError) throw workoutError;
        currentWorkoutId = newWorkout.id;
        setWorkoutId(currentWorkoutId);
      }

      const { error: deleteError } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_id', currentWorkoutId);

      if (deleteError) throw deleteError;

      const exercisesToInsert = exercises.map(ex => ({
        workout_id: currentWorkoutId,
        exercise_name: ex.exercise_name,
        sets: parseInt(ex.sets) || 0,
        reps: parseInt(ex.reps) || 0,
        weight: parseFloat(ex.weight) || 0,
        notes: ex.notes,
        order_index: ex.order_index,
      }));

      const { error: insertError } = await supabase
        .from('workout_exercises')
        .insert(exercisesToInsert);

      if (insertError) throw insertError;

      Alert.alert('Success', 'Workout saved successfully');
      router.back();
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1a8dff" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Session not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#ffffff" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Current Workout</Text>
          <Text style={styles.headerSubtitle}>{session.client_name}</Text>
        </View>
        <TouchableOpacity
          style={[styles.headerButton, styles.saveButton]}
          onPress={saveWorkout}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Save size={24} color="#ffffff" strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.sessionInfo}>
        <Text style={styles.sessionTime}>
          {formatTime(session.start_time)} - {formatTime(session.end_time)}
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No exercises added yet</Text>
            <Text style={styles.emptyStateSubtext}>Tap the + button below to add your first exercise</Text>
          </View>
        ) : (
          exercises.map((exercise, index) => (
            <View key={index} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseNumber}>Exercise {index + 1}</Text>
                <TouchableOpacity
                  onPress={() => removeExercise(index)}
                  activeOpacity={0.7}
                  style={styles.deleteButton}
                >
                  <Trash2 size={18} color="#ef4444" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Exercise Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Bench Press"
                  placeholderTextColor="#5b6f92"
                  value={exercise.exercise_name}
                  onChangeText={(text) => updateExercise(index, 'exercise_name', text)}
                />
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricInput}>
                  <Text style={styles.inputLabel}>Sets</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="3"
                    placeholderTextColor="#5b6f92"
                    keyboardType="number-pad"
                    value={exercise.sets}
                    onChangeText={(text) => updateExercise(index, 'sets', text)}
                  />
                </View>

                <View style={styles.metricInput}>
                  <Text style={styles.inputLabel}>Reps</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10"
                    placeholderTextColor="#5b6f92"
                    keyboardType="number-pad"
                    value={exercise.reps}
                    onChangeText={(text) => updateExercise(index, 'reps', text)}
                  />
                </View>

                <View style={styles.metricInput}>
                  <Text style={styles.inputLabel}>Weight (lbs)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#5b6f92"
                    keyboardType="decimal-pad"
                    value={exercise.weight}
                    onChangeText={(text) => updateExercise(index, 'weight', text)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add notes (optional)"
                  placeholderTextColor="#5b6f92"
                  multiline
                  numberOfLines={3}
                  value={exercise.notes}
                  onChangeText={(text) => updateExercise(index, 'notes', text)}
                />
              </View>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={addExercise}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#0b0f1e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  saveButton: {
    backgroundColor: '#1a8dff',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '600',
    marginTop: 2,
  },
  sessionInfo: {
    backgroundColor: '#0b0f1e',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  sessionTime: {
    fontSize: 14,
    color: '#1a8dff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#5b6f92',
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: '#0b0f1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  exerciseNumber: {
    fontSize: 16,
    color: '#1a8dff',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#5b6f92',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#050814',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#1a8dff',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  errorText: {
    fontSize: 16,
    color: '#5b6f92',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#1a8dff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});
