import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Search, User, ChevronRight, Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import AddClientModal from '@/components/AddClientModal';
import PaywallModal from '@/components/PaywallModal';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  total_sessions: number;
}

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchQuery, clients]);

  const loadClients = async () => {
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

      const { data } = await supabase
        .from('clients')
        .select('id, name, email, phone, total_sessions')
        .eq('trainer_id', trainer.id)
        .order('name');

      if (data) {
        setClients(data);
        setFilteredClients(data);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clients.filter((client) =>
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query)
    );
    setFilteredClients(filtered);
  };

  const handleClientPress = (clientId: string) => {
    router.push(`/client/${clientId}`);
  };

  const handleAddButtonPress = () => {
    if (clients.length >= 5) {
      setShowPaywall(true);
    } else {
      setShowAddModal(true);
    }
  };

  const handleAddClient = async (clientData: { name: string; email: string; phone: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: trainer } = await supabase
      .from('trainers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!trainer) return;

    await supabase.from('clients').insert({
      name: clientData.name,
      email: clientData.email || null,
      phone: clientData.phone || null,
      trainer_id: trainer.id,
      total_sessions: 0,
    });

    await loadClients();
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
        <View style={styles.headerText}>
          <Text style={styles.title}>Clients</Text>
          <Text style={styles.subtitle}>{clients.length} active clients</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddButtonPress}
          activeOpacity={0.7}
        >
          <Plus size={24} color="#ffffff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchIcon}>
          <Search size={20} color="#5b6f92" strokeWidth={2} />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          placeholderTextColor="#5b6f92"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.clientList} contentContainerStyle={styles.clientListContent}>
        {filteredClients.map((client) => (
          <TouchableOpacity
            key={client.id}
            style={styles.clientCard}
            onPress={() => handleClientPress(client.id)}
          >
            <View style={styles.clientInfo}>
              <View style={styles.avatarContainer}>
                <User size={24} color="#1a8dff" strokeWidth={2} />
              </View>
              <View style={styles.clientDetails}>
                <Text style={styles.clientName}>{client.name}</Text>
                <Text style={styles.clientSessions}>{client.total_sessions} sessions completed</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#5b6f92" strokeWidth={2} />
          </TouchableOpacity>
        ))}

        {filteredClients.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No clients found' : 'No clients yet. Add your first client!'}
            </Text>
          </View>
        )}
      </ScrollView>

      <AddClientModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddClient}
      />

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
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
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '600',
  },
  addButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: '#1a8dff',
    shadowColor: '#1a8dff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#050814',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
    height: 56,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  clientList: {
    flex: 1,
  },
  clientListContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0b0f1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 12,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(26, 141, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 17,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  clientSessions: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#5b6f92',
    fontWeight: '500',
  },
});
