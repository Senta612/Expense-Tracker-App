import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { ExpandableCalendar, CalendarProvider } from 'react-native-calendars';

const formatBadgeAmount = (amount) => {
  if (amount >= 1000) {
    return (amount / 1000).toFixed(1).replace('.0', '') + 'k';
  }
  return Math.round(amount).toString();
};

const ExpenseCalendar = ({ expenses, selectedDate, onSelectDate, colors }) => {
  const dailyTotals = useMemo(() => {
    const totals = {};
    expenses.forEach(exp => {
      if (exp.type === 'expense') {
        const d = new Date(exp.date);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        totals[dateKey] = (totals[dateKey] || 0) + parseFloat(exp.amount);
      }
    });
    return totals;
  }, [expenses]);

  const renderDay = ({ date, state }) => {
    const isSelected = date.dateString === selectedDate;
    const totalSpent = dailyTotals[date.dateString];
    const isToday = state === 'today';
    const isDisabled = state === 'disabled';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelectDate(date.dateString)}
        style={[styles.dayContainer, isSelected && { backgroundColor: colors.primary }]}
      >
        <Text style={[
          styles.dayText,
          { color: isSelected ? '#FFF' : (isDisabled ? colors.textSec : colors.text) },
          isToday && !isSelected && { color: colors.primary, fontWeight: '900' }
        ]}>
          {date.day}
        </Text>
        {totalSpent > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.error }, isSelected && { borderColor: '#FFF', borderWidth: 1 }]}>
            <Text style={styles.badgeText}>{formatBadgeAmount(totalSpent)}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.calendarWrapper, { backgroundColor: colors.surface }]}>
      <CalendarProvider date={selectedDate} onDateChanged={onSelectDate}>
        <ExpandableCalendar
          firstDay={1} 
          theme={{
            calendarBackground: colors.surface,
            textSectionTitleColor: colors.textSec,
            monthTextColor: colors.text,
            textMonthFontWeight: '800',
            textMonthFontSize: 18,
            arrowColor: colors.primary,
            'stylesheet.expandable.main': { containerShadow: { shadowColor: 'transparent', elevation: 0 } }
          }}
          dayComponent={renderDay}
          renderKnob={() => <View style={[styles.knob, { backgroundColor: colors.border }]} />}
        />
      </CalendarProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  calendarWrapper: {
    // ✨ NO MORE HACKS! Just a clean bottom border to separate it from the charts.
    borderBottomWidth: 1,
    borderBottomColor: '#88888820',
    paddingBottom: 5,
  },
  dayContainer: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 12, position: 'relative' },
  dayText: { fontSize: 16, fontWeight: '600' },
  badge: { position: 'absolute', top: -4, right: -8, borderRadius: 10, paddingHorizontal: 4, paddingVertical: 2, minWidth: 20, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  knob: { width: 40, height: 4, borderRadius: 2, marginTop: 8 }
});

export default ExpenseCalendar;