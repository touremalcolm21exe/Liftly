import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  sessionsMap: Map<string, number>;
}

export default function Calendar({ selectedDate, onDateSelect, onMonthChange, sessionsMap }: CalendarProps) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const handlePrevMonth = () => {
    const newDate = new Date(currentYear, currentMonth - 1, 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentYear, currentMonth + 1, 1);
    onMonthChange(newDate);
  };

  const handleDatePress = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    onDateSelect(newDate);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
  };

  const getDateKey = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date.toISOString().split('T')[0];
  };

  const hasSessions = (day: number) => {
    const key = getDateKey(day);
    return (sessionsMap.get(key) || 0) > 0;
  };

  const renderCalendarDays = () => {
    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isCurrentDay = isToday(day);
      const isSelectedDay = isSelected(day);
      const hasSession = hasSessions(day);

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            hasSession && !isSelectedDay && !isCurrentDay && styles.dayWithSession,
            isSelectedDay && styles.selectedDay,
            isCurrentDay && !isSelectedDay && styles.todayDay,
          ]}
          onPress={() => handleDatePress(day)}
        >
          <Text style={[
            styles.dayText,
            isSelectedDay && styles.selectedDayText,
            isCurrentDay && !isSelectedDay && styles.todayDayText,
          ]}>
            {day}
          </Text>
          {hasSession && (
            <View style={[
              styles.sessionIndicator,
              isSelectedDay && styles.sessionIndicatorSelected
            ]} />
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
          <ChevronLeft size={24} color="#ffffff" strokeWidth={2} />
        </TouchableOpacity>

        <Text style={styles.monthTitle}>
          {monthNames[currentMonth]} {currentYear}
        </Text>

        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
          <ChevronRight size={24} color="#ffffff" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.daysOfWeek}>
        {dayNames.map((day) => (
          <View key={day} style={styles.dayNameCell}>
            <Text style={styles.dayNameText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {renderCalendarDays()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0b0f1e',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  daysOfWeek: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  dayNameText: {
    fontSize: 13,
    color: '#5b6f92',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayCell: {
    width: `${(100 - 3 * 4) / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    position: 'relative',
    minHeight: 52,
  },
  dayWithSession: {
    backgroundColor: 'rgba(26, 141, 255, 0.12)',
    borderRadius: 14,
  },
  selectedDay: {
    backgroundColor: '#1a8dff',
    borderRadius: 14,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: '#1a8dff',
    borderRadius: 14,
  },
  dayText: {
    fontSize: 17,
    color: '#c8cfdd',
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  todayDayText: {
    color: '#1a8dff',
    fontWeight: '700',
  },
  sessionIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 0,
    backgroundColor: '#1a8dff',
  },
  sessionIndicatorSelected: {
    backgroundColor: '#ffffff',
  },
});
