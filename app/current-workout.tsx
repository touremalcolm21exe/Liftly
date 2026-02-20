import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Square } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface ExerciseSet {
  id?: string;
  set_number: number;
  reps_completed: number;
  weight_used: number;
  completed: boolean;
}

interface Exercise {
  exercise_name: string;
  total_sets: number;
  default_reps: number;
  default_weight: number;
  notes: string;
  order_index: number;
  section?: string;
  sets: ExerciseSet[];
}

interface Session {
  id: string;
  client_id: string;
  client_name: string;
  start_time: string;
  end_time: string;
  date: string;
  workout_template_id: string | null;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
}

export default function CurrentWorkoutScreen() {
  const { sessionId } = useLocalSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadWorkoutData();
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  const loadWorkoutData = async () => {
    try {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('id, client_id, client_name, start_time, end_time, date, workout_template_id')
        .eq('id', sessionId)
        .maybeSingle();

      if (!sessionData) {
        setLoading(false);
        return;
      }

      setSession(sessionData);

      if (sessionData.workout_template_id) {
        const { data: templateData } = await supabase
          .from('workout_templates')
          .select('id, name, description')
          .eq('id', sessionData.workout_template_id)
          .maybeSingle();

        if (templateData) {
          setTemplate(templateData);
        }

        const { data: templateExercises } = await supabase
          .from('template_exercises')
          .select('*')
          .eq('template_id', sessionData.workout_template_id)
          .order('order_index');

        if (templateExercises) {
          const { data: existingSets } = await supabase
            .from('session_exercise_sets')
            .select('*')
            .eq('session_id', sessionData.id);

          const exercisesWithSets: Exercise[] = templateExercises.map((ex) => {
            const defaultReps = typeof ex.reps === 'string' && ex.reps.includes('-')
              ? parseInt(ex.reps.split('-')[0])
              : parseInt(ex.reps) || 10;

            const sets: ExerciseSet[] = [];
            for (let i = 1; i <= ex.sets; i++) {
              const existingSet = existingSets?.find(
                s => s.exercise_name === ex.exercise_name &&
                     s.set_number === i &&
                     s.order_index === ex.order_index
              );

              sets.push({
                id: existingSet?.id,
                set_number: i,
                reps_completed: existingSet?.reps_completed ?? defaultReps,
                weight_used: existingSet?.weight_used ?? ex.weight ?? 0,
                completed: existingSet?.completed ?? false,
              });
            }

            return {
              exercise_name: ex.exercise_name,
              total_sets: ex.sets,
              default_reps: defaultReps,
              default_weight: ex.weight || 0,
              notes: ex.notes || '',
              order_index: ex.order_index,
              section: ex.section,
              sets,
            };
          });

          setExercises(exercisesWithSets);
        }
      }
    } catch (error) {
      console.error('Error loading workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetCompletion = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    const currentSet = newExercises[exerciseIndex].sets[setIndex];
    currentSet.completed = !currentSet.completed;
    setExercises(newExercises);
    triggerAutoSave();
  };

  const updateSetReps = (exerciseIndex: number, setIndex: number, reps: string) => {
    const newExercises = [...exercises];
    const repsNum = parseInt(reps) || 0;
    newExercises[exerciseIndex].sets[setIndex].reps_completed = repsNum;
    setExercises(newExercises);
    triggerAutoSave();
  };

  const updateSetWeight = (exerciseIndex: number, setIndex: number, weight: string) => {
    const newExercises = [...exercises];
    const weightNum = parseFloat(weight) || 0;
    newExercises[exerciseIndex].sets[setIndex].weight_used = weightNum;
    setExercises(newExercises);
    triggerAutoSave();
  };

  const triggerAutoSave = () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    const timer = setTimeout(() => {
      autoSaveWorkout();
    }, 800);
    setAutoSaveTimer(timer);
  };

  const autoSaveWorkout = async () => {
    if (!session) return;

    try {
      const { error: deleteError } = await supabase
        .from('session_exercise_sets')
        .delete()
        .eq('session_id', session.id);

      if (deleteError) throw deleteError;

      const setsToInsert = exercises.flatMap(exercise =>
        exercise.sets.map(set => ({
          session_id: session.id,
          exercise_name: exercise.exercise_name,
          set_number: set.set_number,
          reps_completed: set.reps_completed,
          weight_used: set.weight_used,
          completed: set.completed,
          order_index: exercise.order_index,
        }))
      );

      if (setsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('session_exercise_sets')
          .insert(setsToInsert);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error auto-saving workout:', error);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCompletionStats = () => {
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const completedSets = exercises.reduce(
      (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
      0
    );
    return { totalSets, completedSets };
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

  const { totalSets, completedSets } = getCompletionStats();
  const progressPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

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
        <View style={styles.headerButton} />
      </View>

      <View style={styles.sessionInfo}>
        <Text style={styles.sessionTime}>
          {formatTime(session.start_time)} - {formatTime(session.end_time)}
        </Text>
        {template && (
          <View style={styles.templateBadge}>
            <Text style={styles.templateBadgeText}>{template.name}</Text>
          </View>
        )}
        {totalSets > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {completedSets} / {totalSets} sets completed
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No workout template assigned</Text>
            <Text style={styles.emptyStateSubtext}>
              Assign a workout template to this session to get started
            </Text>
          </View>
        ) : (
          exercises.map((exercise, exerciseIndex) => (
            <View key={exerciseIndex} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseHeaderLeft}>
                  <Text style={styles.exerciseNumber}>{exerciseIndex + 1}</Text>
                  <View>
                    <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
                    {exercise.section && (
                      <View style={[
                        styles.sectionBadge,
                        exercise.section === 'warm-up' && styles.sectionBadgeWarmup,
                        exercise.section === 'cooldown' && styles.sectionBadgeCooldown,
                      ]}>
                        <Text style={styles.sectionBadgeText}>{exercise.section}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {exercise.notes && (
                <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
              )}

              <View style={styles.setsContainer}>
                {exercise.sets.map((set, setIndex) => (
                  <View key={setIndex} style={styles.setRow}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => toggleSetCompletion(exerciseIndex, setIndex)}
                      activeOpacity={0.7}
                    >
                      {set.completed ? (
                        <View style={styles.checkboxChecked}>
                          <Check size={16} color="#ffffff" strokeWidth={3} />
                        </View>
                      ) : (
                        <Square size={24} color="#5b6f92" strokeWidth={2} />
                      )}
                    </TouchableOpacity>

                    <Text style={styles.setLabel}>Set {set.set_number}</Text>

                    <View style={styles.setInputGroup}>
                      <Text style={styles.setInputLabel}>Reps</Text>
                      <TextInput
                        style={styles.setInput}
                        keyboardType="number-pad"
                        value={set.reps_completed.toString()}
                        onChangeText={(text) => updateSetReps(exerciseIndex, setIndex, text)}
                      />
                    </View>

                    <View style={styles.setInputGroup}>
                      <Text style={styles.setInputLabel}>Weight</Text>
                      <TextInput
                        style={styles.setInput}
                        keyboardType="decimal-pad"
                        value={set.weight_used.toString()}
                        onChangeText={(text) => updateSetWeight(exerciseIndex, setIndex, text)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
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
    gap: 12,
  },
  sessionTime: {
    fontSize: 14,
    color: '#1a8dff',
    fontWeight: '600',
  },
  templateBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  templateBadgeText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    gap: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#5b6f92',
    fontWeight: '600',
    textAlign: 'center',
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  exerciseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  exerciseNumber: {
    fontSize: 22,
    color: '#1a8dff',
    fontWeight: '700',
    letterSpacing: -0.5,
    minWidth: 30,
  },
  exerciseName: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  sectionBadge: {
    backgroundColor: 'rgba(26, 141, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  sectionBadgeWarmup: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  sectionBadgeCooldown: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  sectionBadgeText: {
    fontSize: 10,
    color: '#1a8dff',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseNotes: {
    fontSize: 13,
    color: '#5b6f92',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  setsContainer: {
    gap: 10,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#050814',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  checkbox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    backgroundColor: '#22c55e',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setLabel: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    minWidth: 50,
  },
  setInputGroup: {
    flex: 1,
    gap: 4,
  },
  setInputLabel: {
    fontSize: 10,
    color: '#5b6f92',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  setInput: {
    backgroundColor: '#0b0f1e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
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
