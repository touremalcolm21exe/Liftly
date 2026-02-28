import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  Mail,
  Shield,
  Lock,
  Bell,
  Moon,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    email: string;
    role: string;
    name: string;
  } | null>(null);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const role = user.user_metadata?.role || 'user';
        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';

        setUserInfo({
          email: user.email || '',
          role: role.charAt(0).toUpperCase() + role.slice(1),
          name,
        });
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/(auth)/welcome');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Profile</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.profileInfo}>
            <View style={[styles.avatarContainer, { borderColor: colors.primary }]}>
              <User size={32} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.profileText}>
              <Text style={[styles.profileName, { color: colors.text }]}>{userInfo?.name}</Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{userInfo?.email}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { backgroundColor: colors.surfaceAlt }]}>
            <View style={styles.infoIcon}>
              <Shield size={18} color={colors.textSecondary} strokeWidth={2} />
            </View>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Role</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{userInfo?.role}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: colors.surfaceAlt }]}>
              <User size={20} color={colors.textSecondary} strokeWidth={2} />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>Edit Profile</Text>
            <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: colors.surfaceAlt }]}>
              <Lock size={20} color={colors.textSecondary} strokeWidth={2} />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>Change Password</Text>
            <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>App</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: colors.surfaceAlt }]}>
              <Moon size={20} color={colors.textSecondary} strokeWidth={2} />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e0', true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: colors.surfaceAlt }]}>
              <Bell size={20} color={colors.textSecondary} strokeWidth={2} />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#cbd5e0', true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <LogOut size={20} color={colors.error} strokeWidth={2} />
                <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Liftly v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02040a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#02040a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5b6f92',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#0b0f1e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(26, 141, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#1a8dff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#050814',
    borderRadius: 12,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '600',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#050814',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#5b6f92',
    fontWeight: '500',
  },
});
