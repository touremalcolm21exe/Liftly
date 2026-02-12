import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Check, Users } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Client {
  id: string;
  name: string;
}

interface TemplateAssignModalProps {
  visible: boolean;
  onClose: () => void;
  onAssign: () => void;
  template: {
    id: string;
    name: string;
  } | null;
  clients: Client[];
  trainerId: string | null;
}

export default function TemplateAssignModal({
  visible,
  onClose,
  onAssign,
  template,
  clients,
  trainerId,
}: TemplateAssignModalProps) {
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [assignedClients, setAssignedClients] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (visible && template) {
      loadAssignedClients();
    } else {
      setSelectedClients(new Set());
      setAssignedClients(new Set());
    }
  }, [visible, template]);

  const loadAssignedClients = async () => {
    if (!template) return;

    setLoading(true);
    try {
      const { data } = await supabase
        .from('template_assignments')
        .select('client_id')
        .eq('template_id', template.id);

      if (data) {
        const assigned = new Set(data.map((a) => a.client_id));
        setAssignedClients(assigned);
        setSelectedClients(new Set(assigned));
      }
    } catch (error) {
      console.error('Error loading assigned clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleClient = (clientId: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
  };

  const toggleAll = () => {
    if (selectedClients.size === clients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(clients.map((c) => c.id)));
    }
  };

  const handleAssign = async () => {
    if (!template || !trainerId) return;

    setAssigning(true);
    try {
      const clientsToAdd = Array.from(selectedClients).filter(
        (id) => !assignedClients.has(id)
      );
      const clientsToRemove = Array.from(assignedClients).filter(
        (id) => !selectedClients.has(id)
      );

      if (clientsToRemove.length > 0) {
        await supabase
          .from('template_assignments')
          .delete()
          .eq('template_id', template.id)
          .in('client_id', clientsToRemove);
      }

      if (clientsToAdd.length > 0) {
        const assignments = clientsToAdd.map((clientId) => ({
          template_id: template.id,
          client_id: clientId,
          assigned_by: trainerId,
        }));

        await supabase.from('template_assignments').insert(assignments);
      }

      onAssign();
      onClose();
    } catch (error) {
      console.error('Error assigning template:', error);
    } finally {
      setAssigning(false);
    }
  };

  if (!template) return null;

  const hasChanges =
    selectedClients.size !== assignedClients.size ||
    Array.from(selectedClients).some((id) => !assignedClients.has(id));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#ffffff" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.title}>Assign Template</Text>
          <TouchableOpacity
            onPress={handleAssign}
            disabled={assigning || !hasChanges}
            style={[
              styles.assignButton,
              (assigning || !hasChanges) && styles.assignButtonDisabled,
            ]}
          >
            <Text style={styles.assignButtonText}>
              {assigning ? 'Assigning...' : 'Done'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.templateInfo}>
          <Text style={styles.templateName}>{template.name}</Text>
          <Text style={styles.templateSubtitle}>
            Select clients to assign this template
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a8dff" />
          </View>
        ) : (
          <>
            <View style={styles.selectAllContainer}>
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={toggleAll}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedClients.size === clients.length &&
                      clients.length > 0 &&
                      styles.checkboxSelected,
                  ]}
                >
                  {selectedClients.size === clients.length &&
                    clients.length > 0 && (
                      <Check size={16} color="#ffffff" strokeWidth={3} />
                    )}
                </View>
                <Text style={styles.selectAllText}>
                  {selectedClients.size === clients.length && clients.length > 0
                    ? 'Deselect All'
                    : 'Select All'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.selectionCount}>
                {selectedClients.size} of {clients.length} selected
              </Text>
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
            >
              {clients.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Users size={48} color="#5b6f92" strokeWidth={1.5} />
                  </View>
                  <Text style={styles.emptyTitle}>No Clients</Text>
                  <Text style={styles.emptyDescription}>
                    Add clients to assign this template
                  </Text>
                </View>
              ) : (
                clients.map((client) => {
                  const isSelected = selectedClients.has(client.id);
                  const wasAssigned = assignedClients.has(client.id);

                  return (
                    <TouchableOpacity
                      key={client.id}
                      style={[
                        styles.clientCard,
                        isSelected && styles.clientCardSelected,
                      ]}
                      onPress={() => toggleClient(client.id)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && (
                          <Check size={16} color="#ffffff" strokeWidth={3} />
                        )}
                      </View>
                      <View style={styles.clientInfo}>
                        <Text style={styles.clientName}>{client.name}</Text>
                        {wasAssigned && (
                          <Text style={styles.assignedBadge}>
                            Currently Assigned
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </>
        )}
      </View>
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
  assignButton: {
    backgroundColor: '#1a8dff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  assignButtonDisabled: {
    backgroundColor: '#5b6f92',
    opacity: 0.5,
  },
  assignButtonText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '700',
  },
  templateInfo: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  templateName: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 6,
  },
  templateSubtitle: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0b0f1e',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectAllText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
  },
  selectionCount: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
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
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#0b0f1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 12,
  },
  clientCardSelected: {
    borderColor: '#1a8dff',
    backgroundColor: 'rgba(26, 141, 255, 0.05)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#1a8dff',
    borderColor: '#1a8dff',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 2,
  },
  assignedBadge: {
    fontSize: 12,
    color: '#1a8dff',
    fontWeight: '500',
  },
});
