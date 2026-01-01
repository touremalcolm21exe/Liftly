import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Save, User, Mail, Phone, Globe, Plus, ChevronDown, ChevronUp, Trash2, Dumbbell } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import WorkoutLogModal from '@/components/WorkoutLogModal';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  timezone: string;
  goals_notes: string | null;
  total_sessions: number;
}

interface WorkoutExercise {
  id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  notes: string | null;
  order_index: number;
}

interface Workout {
  id: string;
  date: string;
  exercises: WorkoutExercise[];
}

export default function ClientProfileScreen() {
  const { id } = useLocalSearchParams();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadClient();
    loadWorkouts();
  }, [id]);

  const loadClient = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setClient(data);
      }
    } catch (error) {
      console.error('Error loading client:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkouts = async () => {
    setLoadingWorkouts(true);
    try {
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('id, date')
        .eq('client_id', id)
        .order('date', { ascending: false });

      if (workoutsError || !workoutsData) {
        setLoadingWorkouts(false);
        return;
      }

      const workoutsWithExercises = await Promise.all(
        workoutsData.map(async (workout) => {
          const { data: exercises } = await supabase
            .from('workout_exercises')
            .select('*')
            .eq('workout_id', workout.id)
            .order('order_index');

          return {
            ...workout,
            exercises: exercises || [],
          };
        })
      );

      setWorkouts(workoutsWithExercises);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoadingWorkouts(false);
    }
  };

  const handleSave = async () => {
    if (!client) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: client.name,
          email: client.email,
          phone: client.phone,
          timezone: client.timezone,
          goals_notes: client.goals_notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', client.id);

      if (!error) {
        router.back();
      }
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkoutExpansion = (workoutId: string) => {
    const newExpanded = new Set(expandedWorkouts);
    if (newExpanded.has(workoutId)) {
      newExpanded.delete(workoutId);
    } else {
      newExpanded.add(workoutId);
    }
    setExpandedWorkouts(newExpanded);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);

      if (!error) {
        loadWorkouts();
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1a8dff" />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Client not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#ffffff" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Client Profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Save size={24} color="#ffffff" strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <User size={48} color="#1a8dff" strokeWidth={2} />
          </View>
          <Text style={styles.sessionCount}>{client.total_sessions} sessions completed</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONTACT INFORMATION</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#5b6f92" strokeWidth={2} />
              <TextInput
                style={styles.input}
                value={client.name}
                onChangeText={(text) => setClient({ ...client, name: text })}
                placeholder="Client name"
                placeholderTextColor="#5b6f92"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#5b6f92" strokeWidth={2} />
              <TextInput
                style={styles.input}
                value={client.email || ''}
                onChangeText={(text) => setClient({ ...client, email: text })}
                placeholder="email@example.com"
                placeholderTextColor="#5b6f92"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#5b6f92" strokeWidth={2} />
              <TextInput
                style={styles.input}
                value={client.phone || ''}
                onChangeText={(text) => setClient({ ...client, phone: text })}
                placeholder="(555) 123-4567"
                placeholderTextColor="#5b6f92"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time Zone</Text>
            <View style={styles.inputContainer}>
              <Globe size={20} color="#5b6f92" strokeWidth={2} />
              <TextInput
                style={styles.input}
                value={client.timezone}
                onChangeText={(text) => setClient({ ...client, timezone: text })}
                placeholder="America/New_York"
                placeholderTextColor="#5b6f92"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GOALS & NOTES</Text>
          <TextInput
            style={styles.textArea}
            value={client.goals_notes || ''}
            onChangeText={(text) => setClient({ ...client, goals_notes: text })}
            placeholder="Enter client goals, preferences, progress notes..."
            placeholderTextColor="#5b6f92"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.workoutHeader}>
            <Text style={styles.sectionLabel}>RECENT WORKOUTS</Text>
            <TouchableOpacity
              style={styles.logWorkoutButton}
              onPress={() => setShowWorkoutModal(true)}
            >
              <Plus size={18} color="#ffffff" strokeWidth={2} />
              <Text style={styles.logWorkoutText}>Log Workout</Text>
            </TouchableOpacity>
          </View>

          {loadingWorkouts ? (
            <View style={styles.workoutLoading}>
              <ActivityIndicator size="small" color="#1a8dff" />
            </View>
          ) : workouts.length === 0 ? (
            <View style={styles.emptyWorkouts}>
              <Dumbbell size={40} color="#5b6f92" strokeWidth={2} />
              <Text style={styles.emptyText}>No workouts logged yet</Text>
              <Text style={styles.emptySubtext}>Tap "Log Workout" to get started</Text>
            </View>
          ) : (
            <View style={styles.workoutsList}>
              {workouts.map((workout) => (
                <View key={workout.id} style={styles.workoutCard}>
                  <TouchableOpacity
                    style={styles.workoutCardHeader}
                    onPress={() => toggleWorkoutExpansion(workout.id)}
                  >
                    <View style={styles.workoutHeaderLeft}>
                      <Dumbbell size={20} color="#1a8dff" strokeWidth={2} />
                      <View>
                        <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
                        <Text style={styles.workoutExerciseCount}>
                          {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.workoutHeaderRight}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(workout.id);
                        }}
                        style={styles.deleteIconButton}
                      >
                        <Trash2 size={18} color="#ff4444" strokeWidth={2} />
                      </TouchableOpacity>
                      {expandedWorkouts.has(workout.id) ? (
                        <ChevronUp size={20} color="#5b6f92" strokeWidth={2} />
                      ) : (
                        <ChevronDown size={20} color="#5b6f92" strokeWidth={2} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {expandedWorkouts.has(workout.id) && (
                    <View style={styles.workoutDetails}>
                      {workout.exercises.map((exercise, index) => (
                        <View key={exercise.id} style={styles.exerciseItem}>
                          <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
                          <Text style={styles.exerciseStats}>
                            {exercise.sets} sets × {exercise.reps} reps @ {exercise.weight} lbs
                          </Text>
                          {exercise.notes && (
                            <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <WorkoutLogModal
        visible={showWorkoutModal}
        clientId={id as string}
        onClose={() => setShowWorkoutModal(false)}
        onSave={loadWorkouts}
      />

      <Modal
        visible={deleteConfirm !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteConfirm(null)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Delete Workout?</Text>
            <Text style={styles.deleteModalText}>
              This will permanently delete this workout and all its exercises. This action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancel}
                onPress={() => setDeleteConfirm(null)}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalConfirm}
                onPress={() => deleteConfirm && handleDeleteWorkout(deleteConfirm)}
              >
                <Text style={styles.deleteModalConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  saveButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(26, 141, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sessionCount: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#5b6f92',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#050814',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  input: {
    flex: 1,
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
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    minHeight: 160,
  },
  errorText: {
    fontSize: 16,
    color: '#c8cfdd',
    fontWeight: '500',
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a8dff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  logWorkoutText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  workoutLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWorkouts: {
    backgroundColor: '#050814',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#c8cfdd',
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '500',
  },
  workoutsList: {
    gap: 12,
  },
  workoutCard: {
    backgroundColor: '#050814',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  workoutCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  workoutHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  workoutHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteIconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutDate: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  workoutExerciseCount: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '500',
    marginTop: 2,
  },
  workoutDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    gap: 16,
  },
  exerciseItem: {
    gap: 6,
  },
  exerciseName: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  exerciseStats: {
    fontSize: 14,
    color: '#1a8dff',
    fontWeight: '600',
  },
  exerciseNotes: {
    fontSize: 13,
    color: '#5b6f92',
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 4,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  deleteModalContent: {
    backgroundColor: '#050814',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  deleteModalTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  deleteModalText: {
    fontSize: 15,
    color: '#c8cfdd',
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalCancel: {
    flex: 1,
    backgroundColor: '#02040a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalCancelText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  deleteModalConfirm: {
    flex: 1,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalConfirmText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
});
