import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { X, User, MapPin, Clock, Calendar as CalendarIcon, Trash2, Timer, FileText, Dumbbell, CheckCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Session {
  id: string;
  client_name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  duration_minutes?: number;
  notes?: string;
  workout_template_id?: string;
  completed_at?: string | null;
  confirmed_by_trainer?: boolean;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
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

interface SessionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  sessionId: string | null;
  onDelete: () => void;
}

export default function SessionDetailsModal({ visible, onClose, sessionId, onDelete }: SessionDetailsModalProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [workoutTemplate, setWorkoutTemplate] = useState<WorkoutTemplate | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (visible && sessionId) {
      loadSessionDetails();
    }
  }, [visible, sessionId]);

  const loadSessionDetails = async () => {
    setLoading(true);
    try {
      const { data: sessionData, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (error) throw error;

      if (sessionData) {
        setSession(sessionData);

        if (sessionData.workout_template_id) {
          const { data: templateData } = await supabase
            .from('workout_templates')
            .select('id, name, description')
            .eq('id', sessionData.workout_template_id)
            .maybeSingle();

          if (templateData) {
            setWorkoutTemplate(templateData);
          }
        } else {
          setWorkoutTemplate(null);
        }

        const { data: workoutData } = await supabase
          .from('workouts')
          .select('id')
          .eq('session_id', sessionId)
          .maybeSingle();

        if (workoutData) {
          const { data: exercisesData } = await supabase
            .from('workout_exercises')
            .select('*')
            .eq('workout_id', workoutData.id)
            .order('order_index');

          if (exercisesData) {
            setWorkoutExercises(exercisesData);
          }
        } else {
          setWorkoutExercises([]);
        }
      }
    } catch (error) {
      console.error('Error loading session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  };

  const handleDeleteSession = () => {
    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete this session with ${session?.client_name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase
                .from('sessions')
                .delete()
                .eq('id', sessionId);

              onDelete();
              onClose();
            } catch (error) {
              console.error('Error deleting session:', error);
            }
          },
        },
      ]
    );
  };

  const handleConfirmWorkout = async () => {
    if (!sessionId || !session) return;

    setConfirming(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          confirmed_by_trainer: true,
        })
        .eq('id', sessionId);

      if (error) throw error;

      setSession({
        ...session,
        status: 'completed',
        completed_at: new Date().toISOString(),
        confirmed_by_trainer: true,
      });

      onDelete();
    } catch (error) {
      console.error('Error confirming workout:', error);
      Alert.alert('Error', 'Failed to confirm workout. Please try again.');
    } finally {
      setConfirming(false);
    }
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
            <Text style={styles.title}>Session Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#ffffff" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1a8dff" />
            </View>
          ) : session ? (
            <>
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.clientSection}>
                  <View style={styles.avatar}>
                    <User size={32} color="#1a8dff" strokeWidth={2} />
                  </View>
                  <Text style={styles.clientName}>{session.client_name}</Text>
                  <View style={[
                    styles.statusBadge,
                    session.status === 'completed' && styles.statusBadgeCompleted,
                    session.status === 'cancelled' && styles.statusBadgeCancelled,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      session.status === 'completed' && styles.statusTextCompleted,
                      session.status === 'cancelled' && styles.statusTextCancelled,
                    ]}>
                      {session.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <CalendarIcon size={20} color="#1a8dff" strokeWidth={2} />
                    </View>
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Date</Text>
                      <Text style={styles.detailValue}>{formatDate(session.date)}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Clock size={20} color="#1a8dff" strokeWidth={2} />
                    </View>
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Time</Text>
                      <Text style={styles.detailValue}>
                        {formatTime(session.start_time)} - {formatTime(session.end_time)}
                      </Text>
                    </View>
                  </View>

                  {session.duration_minutes && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIcon}>
                        <Timer size={20} color="#1a8dff" strokeWidth={2} />
                      </View>
                      <View style={styles.detailText}>
                        <Text style={styles.detailLabel}>Duration</Text>
                        <Text style={styles.detailValue}>{formatDuration(session.duration_minutes)}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <MapPin size={20} color="#1a8dff" strokeWidth={2} />
                    </View>
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Location</Text>
                      <Text style={styles.detailValue}>{session.location}</Text>
                    </View>
                  </View>

                  {workoutTemplate && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIcon}>
                        <Dumbbell size={20} color="#1a8dff" strokeWidth={2} />
                      </View>
                      <View style={styles.detailText}>
                        <Text style={styles.detailLabel}>Workout</Text>
                        <Text style={styles.detailValue}>{workoutTemplate.name}</Text>
                        {workoutTemplate.description && (
                          <Text style={styles.detailDescription}>{workoutTemplate.description}</Text>
                        )}
                      </View>
                    </View>
                  )}

                  {session.notes && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIcon}>
                        <FileText size={20} color="#1a8dff" strokeWidth={2} />
                      </View>
                      <View style={styles.detailText}>
                        <Text style={styles.detailLabel}>Notes</Text>
                        <Text style={styles.detailValue}>{session.notes}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {workoutExercises.length > 0 && (
                  <View style={styles.workoutSection}>
                    <Text style={styles.workoutSectionTitle}>Workout Exercises</Text>
                    {workoutExercises.map((exercise, index) => (
                      <View key={exercise.id} style={styles.exerciseCard}>
                        <View style={styles.exerciseHeader}>
                          <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
                        </View>
                        <View style={styles.exerciseMetrics}>
                          <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Sets</Text>
                            <Text style={styles.metricValue}>{exercise.sets}</Text>
                          </View>
                          <View style={styles.metricDivider} />
                          <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Reps</Text>
                            <Text style={styles.metricValue}>{exercise.reps}</Text>
                          </View>
                          <View style={styles.metricDivider} />
                          <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Weight</Text>
                            <Text style={styles.metricValue}>{exercise.weight} lbs</Text>
                          </View>
                        </View>
                        {exercise.notes && (
                          <View style={styles.exerciseNotes}>
                            <Text style={styles.exerciseNotesLabel}>Notes:</Text>
                            <Text style={styles.exerciseNotesText}>{exercise.notes}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              {session.status === 'scheduled' && (
                <View style={styles.footer}>
                  <TouchableOpacity
                    style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
                    onPress={handleConfirmWorkout}
                    disabled={confirming}
                  >
                    {confirming ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <CheckCircle size={20} color="#ffffff" strokeWidth={2} />
                        <Text style={styles.confirmButtonText}>Workout Complete</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeleteSession}
                    disabled={confirming}
                  >
                    <Trash2 size={20} color="#ef4444" strokeWidth={2} />
                    <Text style={styles.deleteButtonText}>Delete Session</Text>
                  </TouchableOpacity>
                </View>
              )}
              {session.status === 'completed' && session.confirmed_by_trainer && (
                <View style={styles.footer}>
                  <View style={styles.completedBanner}>
                    <CheckCircle size={24} color="#22c55e" strokeWidth={2} />
                    <View style={styles.completedTextContainer}>
                      <Text style={styles.completedTitle}>Workout Confirmed</Text>
                      {session.completed_at && (
                        <Text style={styles.completedTime}>
                          Completed on {new Date(session.completed_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </>
          ) : null}
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
    maxHeight: '80%',
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
  content: {
    padding: 20,
  },
  clientSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(26, 141, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  clientName: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: 'rgba(26, 141, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#1a8dff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsSection: {
    gap: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 141, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailText: {
    flex: 1,
    paddingTop: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#5b6f92',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  detailDescription: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '400',
    marginTop: 4,
    lineHeight: 20,
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  statusBadgeCancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusTextCompleted: {
    color: '#22c55e',
  },
  statusTextCancelled: {
    color: '#ef4444',
  },
  footer: {
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 16,
    gap: 10,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  completedTextContainer: {
    flex: 1,
  },
  completedTitle: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '700',
    marginBottom: 2,
  },
  completedTime: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  workoutSection: {
    marginTop: 24,
    gap: 12,
  },
  workoutSectionTitle: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  exerciseCard: {
    backgroundColor: '#050814',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    gap: 12,
  },
  exerciseHeader: {
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  exerciseMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: 'rgba(26, 141, 255, 0.08)',
    borderRadius: 8,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#5b6f92',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    color: '#1a8dff',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  exerciseNotes: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  exerciseNotesLabel: {
    fontSize: 12,
    color: '#5b6f92',
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseNotesText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '400',
    lineHeight: 20,
  },
});
