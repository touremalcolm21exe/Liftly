import { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { X, Save } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface ProgressModalProps {
  visible: boolean;
  clientId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function ProgressModal({ visible, clientId, onClose, onSave }: ProgressModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [measurement1, setMeasurement1] = useState('');
  const [measurement1Label, setMeasurement1Label] = useState('Waist');
  const [measurement2, setMeasurement2] = useState('');
  const [measurement2Label, setMeasurement2Label] = useState('Hips');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!weight && !measurement1 && !measurement2) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('progress_measurements')
        .insert({
          client_id: clientId,
          date: date,
          weight: weight ? parseFloat(weight) : null,
          measurement_1: measurement1 ? parseFloat(measurement1) : null,
          measurement_1_label: measurement1Label,
          measurement_2: measurement2 ? parseFloat(measurement2) : null,
          measurement_2_label: measurement2Label,
          notes: notes || null,
        });

      if (!error) {
        setDate(new Date().toISOString().split('T')[0]);
        setWeight('');
        setMeasurement1('');
        setMeasurement1Label('Waist');
        setMeasurement2('');
        setMeasurement2Label('Hips');
        setNotes('');
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error saving measurement:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setWeight('');
    setMeasurement1('');
    setMeasurement1Label('Waist');
    setMeasurement2('');
    setMeasurement2Label('Hips');
    setNotes('');
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
            <Text style={styles.title}>Log Progress</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#ffffff" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.section}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#5b6f92"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Weight (lbs)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="e.g., 175.5"
                placeholderTextColor="#5b6f92"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MEASUREMENTS</Text>

              <View style={styles.measurementGroup}>
                <Text style={styles.label}>Measurement 1</Text>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.flex1]}
                    value={measurement1Label}
                    onChangeText={setMeasurement1Label}
                    placeholder="Label (e.g., Waist)"
                    placeholderTextColor="#5b6f92"
                  />
                  <TextInput
                    style={[styles.input, styles.flex1]}
                    value={measurement1}
                    onChangeText={setMeasurement1}
                    placeholder="Value (inches)"
                    placeholderTextColor="#5b6f92"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.measurementGroup}>
                <Text style={styles.label}>Measurement 2</Text>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.flex1]}
                    value={measurement2Label}
                    onChangeText={setMeasurement2Label}
                    placeholder="Label (e.g., Hips)"
                    placeholderTextColor="#5b6f92"
                  />
                  <TextInput
                    style={[styles.input, styles.flex1]}
                    value={measurement2}
                    onChangeText={setMeasurement2}
                    placeholder="Value (inches)"
                    placeholderTextColor="#5b6f92"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={styles.textArea}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any notes about this measurement..."
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
                  <Text style={styles.saveButtonText}>Save Entry</Text>
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
  sectionLabel: {
    fontSize: 12,
    color: '#5b6f92',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
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
  measurementGroup: {
    marginBottom: 16,
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
