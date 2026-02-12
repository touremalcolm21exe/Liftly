import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';

export default function StatsScreen() {
  const [loading, setLoading] = useState(true);
  const [activeClients, setActiveClients] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [monthSessions, setMonthSessions] = useState(0);
  const [previousMonthSessions, setPreviousMonthSessions] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trainer } = await supabase
        .from('trainers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!trainer) return;

      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .eq('trainer_id', trainer.id);

      const clientCount = clients?.length || 0;
      setActiveClients(clientCount);

      if (clientCount === 0) {
        setTotalSessions(0);
        setMonthSessions(0);
        setPreviousMonthSessions(0);
        return;
      }

      const clientIds = clients!.map(c => c.id);

      const { data: allSessions } = await supabase
        .from('sessions')
        .select('id')
        .in('client_id', clientIds);

      setTotalSessions(allSessions?.length || 0);

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0];
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        .toISOString().split('T')[0];
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toISOString().split('T')[0];

      const { data: currentMonth } = await supabase
        .from('sessions')
        .select('id')
        .in('client_id', clientIds)
        .gte('date', currentMonthStart)
        .lt('date', nextMonthStart);

      setMonthSessions(currentMonth?.length || 0);

      const { data: previousMonth } = await supabase
        .from('sessions')
        .select('id')
        .in('client_id', clientIds)
        .gte('date', previousMonthStart)
        .lt('date', currentMonthStart);

      setPreviousMonthSessions(previousMonth?.length || 0);

    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1a8dff" />
      </View>
    );
  }

  const sessionChange = previousMonthSessions > 0
    ? monthSessions - previousMonthSessions
    : 0;
  const sessionTrend = sessionChange >= 0 ? 'up' : 'down';

  const stats = [
    {
      id: 1,
      label: 'Total Sessions',
      value: totalSessions.toString(),
      change: null,
      trend: 'neutral',
      icon: Calendar,
    },
    {
      id: 2,
      label: 'Active Clients',
      value: activeClients.toString(),
      change: null,
      trend: 'neutral',
      icon: Users,
    },
    {
      id: 3,
      label: 'This Month',
      value: monthSessions.toString(),
      change: sessionChange !== 0 ? `${sessionChange > 0 ? '+' : ''}${sessionChange}` : null,
      trend: sessionTrend,
      icon: TrendingUp,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stats</Text>
        <Text style={styles.subtitle}>This month</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.trend === 'up';

          return (
            <View key={stat.id} style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={styles.iconContainer}>
                  <Icon size={20} color="#1a8dff" strokeWidth={2} />
                </View>
                {stat.change && (
                  <View style={[
                    styles.changeBadge,
                    isPositive ? styles.changeBadgePositive : styles.changeBadgeNegative
                  ]}>
                    {isPositive ? (
                      <TrendingUp size={14} color="#22c55e" strokeWidth={2} />
                    ) : (
                      <TrendingDown size={14} color="#ef4444" strokeWidth={2} />
                    )}
                    <Text style={[
                      styles.changeText,
                      isPositive ? styles.changeTextPositive : styles.changeTextNegative
                    ]}>
                      {stat.change}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          );
        })}

        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartLabel}>Performance Chart</Text>
          <Text style={styles.chartSubtitle}>Coming soon</Text>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statCard: {
    backgroundColor: '#050814',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 141, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  changeBadgePositive: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  changeBadgeNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  changeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  changeTextPositive: {
    color: '#22c55e',
  },
  changeTextNegative: {
    color: '#ef4444',
  },
  statValue: {
    fontSize: 36,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '600',
  },
  chartPlaceholder: {
    backgroundColor: '#0b0f1e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 240,
  },
  chartLabel: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '500',
  },
});
