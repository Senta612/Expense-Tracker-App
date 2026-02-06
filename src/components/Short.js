import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useExpenses } from '../context/ExpenseContext'; // <--- Import Context

export default function Short({ filter, setFilter, activeSort, onSortPress }) {
  const { colors } = useExpenses(); // <--- Get Theme Colors

  const filters = ['All', 'Today', 'Week', 'Month', 'Year'];

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
      >
        {/* Sort Button (Small Icon) */}
        <TouchableOpacity 
            onPress={onSortPress} 
            style={[
                styles.sortBtn, 
                { backgroundColor: colors.surface, borderColor: colors.border } // Theme Colors
            ]}
        >
            <IconButton icon="sort" size={20} iconColor={colors.text} style={{ margin: 0 }} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Filter Chips */}
        {filters.map((item) => {
          const isActive = filter === item;
          return (
            <TouchableOpacity
              key={item}
              onPress={() => setFilter(item)}
              style={[
                styles.chip,
                isActive 
                    ? { backgroundColor: colors.primary, borderColor: colors.primary } // Active Theme
                    : { backgroundColor: colors.surface, borderColor: colors.border }  // Inactive Theme
              ]}
            >
              <Text style={[
                  styles.text, 
                  { color: isActive ? '#FFF' : colors.textSec, fontWeight: isActive ? 'bold' : '500' }
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 15 },
  scroll: { paddingHorizontal: 24, alignItems: 'center' },
  sortBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
    marginRight: 10
  },
  divider: { width: 1, height: 20, backgroundColor: '#ddd', marginRight: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
  },
  text: { fontSize: 13 }
});