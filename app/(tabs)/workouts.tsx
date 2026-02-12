import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Plus, Dumbbell, Users, Clock, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import TemplateBuilderModal from '@/components/TemplateBuilderModal';
import TemplateAssignModal from '@/components/TemplateAssignModal';

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  exercise_count: number;
  assigned_count: number;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

export default function WorkoutsScreen() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);

  useEffect(() => {
    loadData();
  }, []);

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

      setTrainerId(trainer.id);

      const [templatesResult, clientsResult] = await Promise.all([
        supabase
          .from('workout_templates')
          .select(`
            id,
            name,
            description,
            created_at
          `)
          .eq('trainer_id', trainer.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('clients')
          .select('id, name')
          .eq('trainer_id', trainer.id)
          .order('name')
      ]);

      if (templatesResult.data) {
        const templatesWithCounts = await Promise.all(
          templatesResult.data.map(async (template) => {
            const [exerciseCountResult, assignedCountResult] = await Promise.all([
              supabase
                .from('template_exercises')
                .select('id', { count: 'exact', head: true })
                .eq('template_id', template.id),
              supabase
                .from('template_assignments')
                .select('id', { count: 'exact', head: true })
                .eq('template_id', template.id)
            ]);

            return {
              ...template,
              exercise_count: exerciseCountResult.count || 0,
              assigned_count: assignedCountResult.count || 0
            };
          })
        );

        setTemplates(templatesWithCounts);
      }

      if (clientsResult.data) {
        setClients(clientsResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setShowBuilderModal(true);
  };

  const handleEditTemplate = (template: WorkoutTemplate) => {
    setSelectedTemplate(template);
    setShowBuilderModal(true);
  };

  const handleAssignTemplate = (template: WorkoutTemplate) => {
    setSelectedTemplate(template);
    setShowAssignModal(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('workout_templates')
        .delete()
        .eq('id', templateId);

      if (!error) {
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

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
        <Text style={styles.title}>Workout Templates</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateTemplate}
        >
          <Plus size={20} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.createButtonText}>New Template</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {templates.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Dumbbell size={48} color="#5b6f92" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>No Workout Templates</Text>
            <Text style={styles.emptyDescription}>
              Create reusable workout templates to quickly assign to your clients
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleCreateTemplate}
            >
              <Plus size={20} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.emptyButtonText}>Create First Template</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.templatesGrid}>
            {templates.map((template) => (
              <View key={template.id} style={styles.templateCard}>
                <TouchableOpacity
                  style={styles.templateContent}
                  onPress={() => handleEditTemplate(template)}
                >
                  <View style={styles.templateHeader}>
                    <View style={styles.templateIconContainer}>
                      <Dumbbell size={24} color="#1a8dff" strokeWidth={2} />
                    </View>
                    <View style={styles.templateInfo}>
                      <Text style={styles.templateName}>{template.name}</Text>
                      {template.description && (
                        <Text style={styles.templateDescription} numberOfLines={2}>
                          {template.description}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.templateStats}>
                    <View style={styles.statItem}>
                      <Dumbbell size={16} color="#5b6f92" strokeWidth={2} />
                      <Text style={styles.statText}>
                        {template.exercise_count} {template.exercise_count === 1 ? 'exercise' : 'exercises'}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Users size={16} color="#5b6f92" strokeWidth={2} />
                      <Text style={styles.statText}>
                        {template.assigned_count} {template.assigned_count === 1 ? 'client' : 'clients'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={styles.templateActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditTemplate(template)}
                  >
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.assignButton]}
                    onPress={() => handleAssignTemplate(template)}
                  >
                    <Text style={[styles.actionButtonText, styles.assignButtonText]}>
                      Assign
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteTemplate(template.id)}
                  >
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <TemplateBuilderModal
        visible={showBuilderModal}
        onClose={() => {
          setShowBuilderModal(false);
          setSelectedTemplate(null);
        }}
        onSave={loadData}
        trainerId={trainerId}
        template={selectedTemplate}
      />

      <TemplateAssignModal
        visible={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedTemplate(null);
        }}
        onAssign={loadData}
        template={selectedTemplate}
        clients={clients}
        trainerId={trainerId}
      />
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
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a8dff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  createButtonText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(91, 111, 146, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#5b6f92',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a8dff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  templatesGrid: {
    gap: 16,
  },
  templateCard: {
    backgroundColor: '#0b0f1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  templateContent: {
    padding: 20,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  templateIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 141, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#5b6f92',
    lineHeight: 20,
  },
  templateStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '500',
  },
  templateActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '600',
  },
  assignButton: {
    backgroundColor: 'rgba(26, 141, 255, 0.1)',
  },
  assignButtonText: {
    color: '#1a8dff',
  },
  deleteButton: {},
  deleteButtonText: {
    color: '#ff4757',
  },
});
