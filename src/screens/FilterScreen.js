import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { Text, Surface, IconButton, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useExpenses } from '../context/ExpenseContext';
import Compare from '../components/Compare'; // Make sure this path is correct for your app!

export default function FilterScreen({ navigation }) {
  // 1. Get Global State
  const { expenses, colors, currency, categories, paymentModes, upiApps } = useExpenses();

  const [activeTab, setActiveTab] = useState('Filter');

  // 2. Filter States
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedModes, setSelectedModes] = useState([]);

  // Date Range States
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // 3. Toggles
  const toggleSelection = (item, list, setList) => {
    if (list.includes(item)) setList(list.filter(i => i !== item));
    else setList([...list, item]);
  };

  const clearAllFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedCats([]);
    setSelectedModes([]);
  };

  // 4. Advanced Filter Logic
  const filteredData = expenses.filter(item => {
    const itemDate = new Date(item.date);
    itemDate.setHours(0, 0, 0, 0);

    const matchCategory = selectedCats.length === 0 || selectedCats.includes(item.category);
    const matchMode = selectedModes.length === 0 || selectedModes.includes(item.paymentMode) || selectedModes.includes(item.paymentApp);

    let matchDate = true;
    if (startDate) {
      const start = new Date(startDate); start.setHours(0, 0, 0, 0);
      if (itemDate < start) matchDate = false;
    }
    if (endDate) {
      const end = new Date(endDate); end.setHours(23, 59, 59, 999);
      if (itemDate > end) matchDate = false;
    }

    return matchCategory && matchMode && matchDate;
  });

  // Calculate Totals safely based on Income vs Expense
  const totalSpent = filteredData.filter(e => e.type === 'expense' || !e.type).reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = filteredData.filter(e => e.type === 'income').reduce((sum, item) => sum + item.amount, 0);

  // 5. Build the UI for the Filters (Rendered as the Header of the List)
  const renderFilterControls = () => (
    <View style={{ paddingBottom: 20 }}>

      {/* --- SECTION 1: Date Range --- */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 }}>
        <Text style={[styles.sectionTitle, { color: colors.textSec, marginTop: 0, marginBottom: 0 }]}>Date Range</Text>
        {(startDate || endDate || selectedCats.length > 0 || selectedModes.length > 0) && (
          <TouchableOpacity onPress={clearAllFilters}>
            <Text style={{ color: colors.error, fontSize: 13, fontWeight: 'bold' }}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.dateRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateBtn}>
          <Text style={[styles.dateLabel, { color: colors.textSec }]}>From Date</Text>
          <Text style={[styles.dateValue, { color: startDate ? colors.text : colors.textSec }]}>
            {startDate ? startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select Start'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.dateDivider, { backgroundColor: colors.border }]} />

        <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateBtn}>
          <Text style={[styles.dateLabel, { color: colors.textSec }]}>To Date</Text>
          <Text style={[styles.dateValue, { color: endDate ? colors.text : colors.textSec }]}>
            {endDate ? endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select End'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- SECTION 2: Categories --- */}
      <Text style={[styles.sectionTitle, { color: colors.textSec }]}>Categories</Text>
      <View style={styles.chipContainer}>
        {['Income', ...categories].map(cat => {
          const isSelected = selectedCats.includes(cat);
          return (
            <TouchableOpacity key={cat} onPress={() => toggleSelection(cat, selectedCats, setSelectedCats)}
              style={[styles.chip, isSelected ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.chipText, isSelected ? { color: '#FFF' } : { color: colors.text }]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* --- SECTION 3: Payment Modes --- */}
      <Text style={[styles.sectionTitle, { color: colors.textSec }]}>Payment Modes</Text>
      <View style={styles.chipContainer}>
        {[...paymentModes, ...upiApps].map(mode => {
          const isSelected = selectedModes.includes(mode);
          return (
            <TouchableOpacity key={mode} onPress={() => toggleSelection(mode, selectedModes, setSelectedModes)}
              style={[styles.chip, isSelected ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.chipText, isSelected ? { color: '#FFF' } : { color: colors.text }]}>{mode}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* --- SECTION 4: Total Summary Card --- */}
      <Surface style={[styles.totalCard, { backgroundColor: colors.surface, borderColor: colors.border }]} elevation={2}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.totalLabel, { color: colors.textSec }]}>Filtered Spent</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>{currency}{totalSpent.toLocaleString('en-IN')}</Text>
        </View>
        <View style={{ width: 1, height: 40, backgroundColor: colors.border, marginHorizontal: 15 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.totalLabel, { color: colors.textSec }]}>Filtered Income</Text>
          <Text style={[styles.totalValue, { color: colors.success }]}>+{currency}{totalIncome.toLocaleString('en-IN')}</Text>
        </View>
      </Surface>

      <Text style={[styles.sectionTitle, { color: colors.textSec, marginBottom: 10 }]}>Results ({filteredData.length})</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>

      {/* Date Pickers (Rendered invisibly at root level to prevent layout bugs) */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => { setShowStartPicker(Platform.OS === 'ios'); if (d && e.type === 'set') setStartDate(d); }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => { setShowEndPicker(Platform.OS === 'ios'); if (d && e.type === 'set') setEndDate(d); }}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <IconButton icon="arrow-left" size={26} iconColor={colors.text} style={{ margin: 0 }} />
        </TouchableOpacity>

        {/* Segmented Control */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.inputBg }]}>
          <TouchableOpacity onPress={() => setActiveTab('Filter')} style={[styles.segmentBtn, activeTab === 'Filter' && { backgroundColor: colors.surface, elevation: 2 }]}>
            <Text style={[styles.segmentText, { color: activeTab === 'Filter' ? colors.text : colors.textSec }]}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('Compare')} style={[styles.segmentBtn, activeTab === 'Compare' && { backgroundColor: colors.surface, elevation: 2 }]}>
            <Text style={[styles.segmentText, { color: activeTab === 'Compare' ? colors.text : colors.textSec }]}>Compare</Text>
          </TouchableOpacity>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {activeTab === 'Filter' ? (
          <FlatList
            data={filteredData}
            keyExtractor={item => item.id}
            ListHeaderComponent={renderFilterControls} // ✨ PRO UX: Puts all UI inside the scrolling list!
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isIncome = item.type === 'income';
              return (
                <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={1}>
                  <View style={styles.row}>
                    <View>
                      <Text style={[styles.itemTitle, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.itemDate, { color: colors.textSec }]}>
                        {new Date(item.date).toLocaleDateString()} • {item.category} • {item.paymentApp || item.paymentMode}
                      </Text>
                    </View>
                    <Text style={[styles.itemAmount, { color: isIncome ? colors.success : colors.text }]}>
                      {isIncome ? '+' : '-'}{currency}{item.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </Surface>
              );
            }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Avatar.Icon size={64} icon="text-search" color={colors.textSec} style={{ backgroundColor: 'transparent' }} />
                <Text style={[styles.emptyText, { color: colors.textSec }]}>No transactions match these filters.</Text>
              </View>
            }
          />
        ) : (
          <Compare expenses={expenses} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingTop: 10, marginBottom: 10 },
  backBtn: { padding: 0 },

  segmentContainer: { flexDirection: 'row', borderRadius: 20, padding: 4 },
  segmentBtn: { paddingVertical: 6, paddingHorizontal: 20, borderRadius: 16 },
  segmentText: { fontWeight: '600' },

  content: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 12, marginTop: 20, textTransform: 'uppercase', letterSpacing: 0.5 },

  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },

  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 10 },
  dateBtn: { flex: 1, padding: 8, alignItems: 'center' },
  dateDivider: { width: 1, height: 30 },
  dateLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  dateValue: { fontSize: 14, fontWeight: '700' },

  totalCard: { padding: 20, borderRadius: 16, marginTop: 25, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
  totalLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  totalValue: { fontSize: 24, fontWeight: '800' },

  card: { padding: 16, borderRadius: 16, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '700' },
  itemAmount: { fontSize: 18, fontWeight: '800' },
  itemDate: { fontSize: 12, marginTop: 6, fontWeight: '500' },
  emptyText: { textAlign: 'center', marginTop: 10, fontSize: 15, fontWeight: '500' },
});