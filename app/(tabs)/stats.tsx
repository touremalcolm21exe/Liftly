import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react-native';

export default function StatsScreen() {
  const stats = [
    {
      id: 1,
      label: 'Revenue',
      value: '$12,450',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      id: 2,
      label: 'Active Clients',
      value: '24',
      change: '+3',
      trend: 'up',
      icon: Users,
    },
    {
      id: 3,
      label: 'Sessions',
      value: '156',
      change: '-8',
      trend: 'down',
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
                  <Icon size={24} color="#1a8dff" strokeWidth={2} />
                </View>
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(26, 141, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
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
