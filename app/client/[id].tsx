import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Save, User, Mail, Phone, Globe } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  timezone: string;
  goals_notes: string | null;
  total_sessions: number;
}

export default function ClientProfileScreen() {
  const { id } = useLocalSearchParams();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClient();
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
});
