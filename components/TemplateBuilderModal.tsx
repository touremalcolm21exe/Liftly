import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Plus, Trash2, GripVertical } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Exercise {
  id?: string;
  exercise_name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string;
  section: 'warm-up' | 'main' | 'cooldown';
  order_index: number;
}

interface TemplateBuilderModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  trainerId: string | null;
  template?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

export default function TemplateBuilderModal({
  visible,
  onClose,
  onSave,
  trainerId,
  template,
}: TemplateBuilderModalProps) {
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (template) {
        loadTemplate();
      } else {
        resetForm();
      }
    }
  }, [visible, template]);

  const resetForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setExercises([]);
  };

  const loadTemplate = async () => {
    if (!template) return;

    setTemplateName(template.name);
    setTemplateDescription(template.description || '');

    const { data } = await supabase
      .from('template_exercises')
      .select('*')
      .eq('template_id', template.id)
      .order('order_index');

    if (data) {
      setExercises(data);
    }
  };

  const addExercise = (section: 'warm-up' | 'main' | 'cooldown') => {
    const newExercise: Exercise = {
      exercise_name: '',
      sets: 3,
      reps: '10',
      rest_seconds: 60,
      notes: '',
      section,
      order_index: exercises.length,
    };
    setExercises([...exercises, newExercise]);
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const removeExercise = (index: number) => {
    const updated = exercises.filter((_, i) => i !== index);
    updated.forEach((ex, i) => {
      ex.order_index = i;
    });
    setExercises(updated);
  };

  const handleSave = async () => {
    if (!trainerId || !templateName.trim()) return;

    setSaving(true);
    try {
      let templateId = template?.id;

      if (template) {
        await supabase
          .from('workout_templates')
          .update({
            name: templateName,
            description: templateDescription || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', template.id);

        await supabase
          .from('template_exercises')
          .delete()
          .eq('template_id', template.id);
      } else {
        const { data, error } = await supabase
          .from('workout_templates')
          .insert({
            trainer_id: trainerId,
            name: templateName,
            description: templateDescription || null,
          })
          .select()
          .single();

        if (error || !data) {
          throw error;
        }
        templateId = data.id;
      }

      if (exercises.length > 0 && templateId) {
        const exercisesToInsert = exercises.map((ex) => ({
          template_id: templateId,
          exercise_name: ex.exercise_name,
          sets: ex.sets,
          reps: ex.reps,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes || null,
          section: ex.section,
          order_index: ex.order_index,
        }));

        await supabase.from('template_exercises').insert(exercisesToInsert);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setSaving(false);
    }
  };

  const getExercisesBySection = (section: 'warm-up' | 'main' | 'cooldown') => {
    return exercises.filter((ex) => ex.section === section);
  };

  const renderSection = (section: 'warm-up' | 'main' | 'cooldown', title: string) => {
    const sectionExercises = getExercisesBySection(section);

    return (
      <View style={styles.section} key={section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity
            style={styles.addExerciseButton}
            onPress={() => addExercise(section)}
          >
            <Plus size={16} color="#1a8dff" strokeWidth={2.5} />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>

        {sectionExercises.map((exercise, index) => {
          const globalIndex = exercises.indexOf(exercise);
          return (
            <View key={globalIndex} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <GripVertical size={20} color="#5b6f92" strokeWidth={1.5} />
                <TextInput
                  style={styles.exerciseNameInput}
                  placeholder="Exercise name"
                  placeholderTextColor="#5b6f92"
                  value={exercise.exercise_name}
                  onChangeText={(value) =>
                    updateExercise(globalIndex, 'exercise_name', value)
                  }
                />
                <TouchableOpacity
                  onPress={() => removeExercise(globalIndex)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={18} color="#ff4757" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View style={styles.exerciseDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Sets</Text>
                    <TextInput
                      style={styles.detailInput}
                      keyboardType="number-pad"
                      value={String(exercise.sets)}
                      onChangeText={(value) =>
                        updateExercise(globalIndex, 'sets', parseInt(value) || 0)
                      }
                    />
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Reps</Text>
                    <TextInput
                      style={styles.detailInput}
                      placeholder="10 or 8-12"
                      placeholderTextColor="#5b6f92"
                      value={exercise.reps}
                      onChangeText={(value) =>
                        updateExercise(globalIndex, 'reps', value)
                      }
                    />
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Rest (sec)</Text>
                    <TextInput
                      style={styles.detailInput}
                      keyboardType="number-pad"
                      value={String(exercise.rest_seconds)}
                      onChangeText={(value) =>
                        updateExercise(
                          globalIndex,
                          'rest_seconds',
                          parseInt(value) || 0
                        )
                      }
                    />
                  </View>
                </View>

                <TextInput
                  style={styles.notesInput}
                  placeholder="Notes (optional)"
                  placeholderTextColor="#5b6f92"
                  value={exercise.notes}
                  onChangeText={(value) => updateExercise(globalIndex, 'notes', value)}
                  multiline
                />
              </View>
            </View>
          );
        })}

        {sectionExercises.length === 0 && (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>No exercises in this section</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#ffffff" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {template ? 'Edit Template' : 'New Template'}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !templateName.trim()}
            style={[
              styles.saveButton,
              (saving || !templateName.trim()) && styles.saveButtonDisabled,
            ]}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formSection}>
            <Text style={styles.label}>Template Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Upper Body Strength"
              placeholderTextColor="#5b6f92"
              value={templateName}
              onChangeText={setTemplateName}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Brief description of this workout"
              placeholderTextColor="#5b6f92"
              value={templateDescription}
              onChangeText={setTemplateDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.divider} />

          {renderSection('warm-up', 'Warm-Up')}
          {renderSection('main', 'Main Workout')}
          {renderSection('cooldown', 'Cool Down')}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02040a',
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
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#1a8dff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#5b6f92',
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#0b0f1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(26, 141, 255, 0.15)',
  },
  addExerciseText: {
    fontSize: 14,
    color: '#1a8dff',
    fontWeight: '600',
  },
  exerciseCard: {
    backgroundColor: '#0b0f1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  exerciseNameInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  exerciseDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#5b6f92',
    fontWeight: '600',
    marginBottom: 6,
  },
  detailInput: {
    backgroundColor: '#050814',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  notesInput: {
    backgroundColor: '#050814',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  emptySection: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0f1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderStyle: 'dashed',
  },
  emptySectionText: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '500',
  },
});
