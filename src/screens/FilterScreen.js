import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker'; 
import { useExpenses } from '../context/ExpenseContext';
import Compare from '../components/Compare';

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Other'];

export default function FilterScreen({ navigation }) {
  // 1. Get Colors & Expenses
  const { expenses, colors } = useExpenses(); 

  const [activeTab, setActiveTab] = useState('Filter'); 
  const [selectedCats, setSelectedCats] = useState([]);

  // Date Range
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const toggleCategory = (cat) => {
    if (selectedCats.includes(cat)) {
      setSelectedCats(selectedCats.filter(c => c !== cat));
    } else {
      setSelectedCats([...selectedCats, cat]);
    }
  };

  const clearDates = () => { setStartDate(null); setEndDate(null); };

  const renderFilterView = () => {
    // FILTER LOGIC
    const filteredData = expenses.filter(item => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0); 
      const matchCategory = selectedCats.length === 0 || selectedCats.includes(item.category);
      let matchDate = true;
      if (startDate) {
        const start = new Date(startDate); start.setHours(0,0,0,0);
        if (itemDate < start) matchDate = false;
      }
      if (endDate) {
        const end = new Date(endDate); end.setHours(23,59,59,999);
        if (itemDate > end) matchDate = false;
      }
      return matchCategory && matchDate;
    });

    const totalAmount = filteredData.reduce((sum, item) => sum + item.amount, 0);

    return (
      <View style={{ flex: 1 }}>
        {/* --- SECTION 1: Categories --- */}
        <Text style={[styles.sectionTitle, { color: colors.textSec }]}>Filter by Category</Text>
        <View style={styles.chipContainer}>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCats.includes(cat);
            return (
                <TouchableOpacity
                    key={cat}
                    onPress={() => toggleCategory(cat)}
                    style={[
                        styles.chip, 
                        isSelected ? { backgroundColor: colors.primary, borderColor: colors.primary } 
                                   : { backgroundColor: colors.surface, borderColor: colors.border }
                    ]}
                >
                    <Text style={[
                        styles.chipText, 
                        isSelected ? { color: '#FFF' } : { color: colors.text }
                    ]}>{cat}</Text>
                </TouchableOpacity>
            );
          })}
        </View>

        {/* --- SECTION 2: Date Range Picker --- */}
        <View style={[styles.dateRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateBtn}>
                <Text style={[styles.dateLabel, { color: colors.textSec }]}>From:</Text>
                <Text style={[styles.dateValue, { color: colors.text }]}>{startDate ? startDate.toLocaleDateString() : 'Start Date'}</Text>
            </TouchableOpacity>

            <IconButton icon="arrow-right" size={16} iconColor={colors.textSec} />

            <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateBtn}>
                <Text style={[styles.dateLabel, { color: colors.textSec }]}>To:</Text>
                <Text style={[styles.dateValue, { color: colors.text }]}>{endDate ? endDate.toLocaleDateString() : 'End Date'}</Text>
            </TouchableOpacity>

            {(startDate || endDate) && (
                <IconButton icon="close-circle" size={20} iconColor={colors.error} onPress={clearDates} />
            )}
        </View>

        {showStartPicker && (<DateTimePicker value={startDate || new Date()} mode="date" display="default" onChange={(e, d) => { setShowStartPicker(false); if (d) setStartDate(d); }} />)}
        {showEndPicker && (<DateTimePicker value={endDate || new Date()} mode="date" display="default" onChange={(e, d) => { setShowEndPicker(false); if (d) setEndDate(d); }} />)}

        {/* --- SECTION 3: Total Card --- */}
        <Surface style={[styles.totalCard, { backgroundColor: colors.surface, borderColor: colors.border }]} elevation={2}>
            <View>
                <Text style={[styles.totalLabel, { color: colors.textSec }]}>Total Spent</Text>
                <Text style={[styles.filterInfo, { color: colors.text }]}>
                    {selectedCats.length > 0 ? selectedCats.join(', ') : 'All Categories'} 
                    {startDate || endDate ? ' • Custom Date' : ''}
                </Text>
            </View>
            <Text style={[styles.totalValue, { color: colors.text }]}>₹{totalAmount.toLocaleString('en-IN')}</Text>
        </Surface>

        {/* --- SECTION 4: Results List --- */}
        <Text style={[styles.sectionTitle, { color: colors.textSec }]}>Results ({filteredData.length})</Text>
        <FlatList
          data={filteredData}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={1}>
              <View style={styles.row}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.itemAmount, { color: colors.error }]}>-₹{item.amount}</Text>
              </View>
              <Text style={[styles.itemDate, { color: colors.textSec }]}>{new Date(item.date).toLocaleDateString()} • {item.category}</Text>
            </Surface>
          )}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSec }]}>No expenses found for this filter.</Text>}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <IconButton icon="arrow-left" size={26} iconColor={colors.text} style={{margin:0}} />
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
        {activeTab === 'Filter' ? renderFilterView() : <Compare expenses={expenses} />}
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
  
  content: { flex: 1, paddingHorizontal: 24 }, 
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 10, marginTop: 10, textTransform: 'uppercase' },
  
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, padding: 10, borderRadius: 12, borderWidth: 1 },
  dateBtn: { flex: 1, padding: 5 },
  dateLabel: { fontSize: 10, textTransform: 'uppercase' },
  dateValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },

  totalCard: { padding: 20, borderRadius: 16, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
  totalLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  filterInfo: { fontSize: 11, marginTop: 4, fontWeight: '500', maxWidth: 150 },
  totalValue: { fontSize: 28, fontWeight: '800' },

  card: { padding: 16, borderRadius: 12, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  itemAmount: { fontSize: 16, fontWeight: 'bold' },
  itemDate: { fontSize: 12, marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 30 },
});