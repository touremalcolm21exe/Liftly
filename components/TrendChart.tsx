import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';

interface DataPoint {
  date: string;
  value: number;
}

interface TrendChartProps {
  data: DataPoint[];
  label: string;
  unit: string;
  color?: string;
}

export default function TrendChart({ data, label, unit, color = '#1a8dff' }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data yet</Text>
      </View>
    );
  }

  const chartWidth = 320;
  const chartHeight = 120;
  const padding = 20;
  const dotRadius = 4;

  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - ((point.value - minValue) / valueRange) * (chartHeight - 2 * padding);
    return { x, y, value: point.value };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  const latestValue = values[values.length - 1];
  const previousValue = values.length > 1 ? values[values.length - 2] : latestValue;
  const change = latestValue - previousValue;
  const changePercent = previousValue !== 0 ? ((change / previousValue) * 100).toFixed(1) : '0.0';
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>
              {latestValue.toFixed(1)} {unit}
            </Text>
            {!isNeutral && (
              <View style={[styles.changeBadge, isPositive ? styles.changeBadgeUp : styles.changeBadgeDown]}>
                <Text style={[styles.changeText, isPositive ? styles.changeTextUp : styles.changeTextDown]}>
                  {isPositive ? '+' : ''}{changePercent}%
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          <Line
            x1={padding}
            y1={chartHeight - padding}
            x2={chartWidth - padding}
            y2={chartHeight - padding}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
          />

          {data.length > 1 && (
            <Polyline
              points={polylinePoints}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={dotRadius}
              fill={color}
            />
          ))}
        </Svg>
      </View>

      {data.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
          {data.length > 1 && (
            <Text style={styles.footerText}>
              {new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#050814',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#5b6f92',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeBadgeUp: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  changeBadgeDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  changeTextUp: {
    color: '#22c55e',
  },
  changeTextDown: {
    color: '#ef4444',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  footerText: {
    fontSize: 11,
    color: '#5b6f92',
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: '#050814',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#5b6f92',
    fontWeight: '500',
  },
});
