import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Search, User, ChevronRight } from 'lucide-react-native';

export default function ClientsScreen() {
  const mockClients = [
    { id: 1, name: 'Sarah Johnson', sessions: 12 },
    { id: 2, name: 'Mike Thompson', sessions: 8 },
    { id: 3, name: 'Emily Davis', sessions: 15 },
    { id: 4, name: 'James Wilson', sessions: 6 },
    { id: 5, name: 'Lisa Anderson', sessions: 10 },
    { id: 6, name: 'David Martinez', sessions: 9 },
    { id: 7, name: 'Rachel Brown', sessions: 14 },
    { id: 8, name: 'Chris Taylor', sessions: 7 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clients</Text>
        <Text style={styles.subtitle}>{mockClients.length} active clients</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchIcon}>
          <Search size={20} color="#5b6f92" strokeWidth={2} />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          placeholderTextColor="#5b6f92"
        />
      </View>

      <ScrollView style={styles.clientList} contentContainerStyle={styles.clientListContent}>
        {mockClients.map((client) => (
          <TouchableOpacity key={client.id} style={styles.clientCard}>
            <View style={styles.clientInfo}>
              <View style={styles.avatarContainer}>
                <User size={24} color="#1a8dff" strokeWidth={2} />
              </View>
              <View style={styles.clientDetails}>
                <Text style={styles.clientName}>{client.name}</Text>
                <Text style={styles.clientSessions}>{client.sessions} sessions completed</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#5b6f92" strokeWidth={2} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02040a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
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
});
