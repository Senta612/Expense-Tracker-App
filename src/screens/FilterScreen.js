import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { Text, Surface, Button, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker'; // Import Date Picker
import { useExpenses } from '../context/ExpenseContext';

import Compare from '../components/Compare';

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Other'];

export default function FilterScreen({ navigation }) {
  const { expenses } = useExpenses();
  const [activeTab, setActiveTab] = useState('Filter'); 
  const [selectedCats, setSelectedCats] = useState([]);

  // --- NEW: Date Range States ---
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

  // Helper to clear dates
  const clearDates = () => {
    setStartDate(null);
    setEndDate(null);
  };

  // --- Render Filter View (List) ---
  const renderFilterView = () => {
    // 1. FILTER LOGIC
    const filteredData = expenses.filter(item => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0); // Normalize time to midnight

      // Check 1: Category
      const matchCategory = selectedCats.length === 0 || selectedCats.includes(item.category);
      
      // Check 2: Date Range
      let matchDate = true;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        if (itemDate < start) matchDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23,59,59,999); // End of that day
        if (itemDate > end) matchDate = false;
      }

      return matchCategory && matchDate;
    });

    // 2. Calculate Total
    const totalAmount = filteredData.reduce((sum, item) => sum + item.amount, 0);

    return (
      <View style={{ flex: 1 }}>
        {/* --- SECTION 1: Categories --- */}
        <Text style={styles.sectionTitle}>Filter by Category</Text>
        <View style={styles.chipContainer}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => toggleCategory(cat)}
              style={[styles.chip, selectedCats.includes(cat) ? styles.activeChip : styles.inactiveChip]}
            >
              <Text style={[styles.chipText, selectedCats.includes(cat) ? styles.activeChipText : styles.inactiveChipText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- SECTION 2: Date Range Picker --- */}
        <View style={styles.dateRow}>
            <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateBtn}>
                <Text style={styles.dateLabel}>From:</Text>
                <Text style={styles.dateValue}>{startDate ? startDate.toLocaleDateString() : 'Start Date'}</Text>
            </TouchableOpacity>

            <Text style={{color:'#999'}}>→</Text>

            <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateBtn}>
                <Text style={styles.dateLabel}>To:</Text>
                <Text style={styles.dateValue}>{endDate ? endDate.toLocaleDateString() : 'End Date'}</Text>
            </TouchableOpacity>

            {(startDate || endDate) && (
                <IconButton icon="close-circle" size={20} iconColor="#FF5252" onPress={clearDates} />
            )}
        </View>

        {/* Date Pickers (Hidden unless clicked) */}
        {showStartPicker && (
            <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                    setShowStartPicker(false);
                    if (date) setStartDate(date);
                }}
            />
        )}
        {showEndPicker && (
            <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                    setShowEndPicker(false);
                    if (date) setEndDate(date);
                }}
            />
        )}

        {/* --- SECTION 3: Total Card --- */}
        <Surface style={styles.totalCard} elevation={2}>
            <View>
                <Text style={styles.totalLabel}>Total Spent</Text>
                {/* Show filters applied text */}
                <Text style={styles.filterInfo}>
                   {selectedCats.length > 0 ? selectedCats.join(', ') : 'All Categories'} 
                   {startDate || endDate ? ' • Custom Date' : ''}
                </Text>
            </View>
            <Text style={styles.totalValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
        </Surface>

        {/* --- SECTION 4: Results List --- */}
        <Text style={styles.sectionTitle}>Results ({filteredData.length})</Text>
        <FlatList
          data={filteredData}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Surface style={styles.card} elevation={1}>
              <View style={styles.row}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemAmount}>-₹{item.amount}</Text>
              </View>
              <Text style={styles.itemDate}>{new Date(item.date).toLocaleDateString()} • {item.category}</Text>
            </Surface>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No expenses found for this filter.</Text>}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.segmentContainer}>
          <TouchableOpacity onPress={() => setActiveTab('Filter')} style={[styles.segmentBtn, activeTab === 'Filter' && styles.activeSegment]}>
            <Text style={[styles.segmentText, activeTab === 'Filter' && styles.activeSegmentText]}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('Compare')} style={[styles.segmentBtn, activeTab === 'Compare' && styles.activeSegment]}>
            <Text style={[styles.segmentText, activeTab === 'Compare' && styles.activeSegmentText]}>Compare</Text>
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

// ... (Keep the rest of the code same, just update the Styles)

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingTop: 10, marginBottom: 10 },
  backBtn: { padding: 10 },
  backText: { fontSize: 24, color: '#333' },
  
  segmentContainer: { flexDirection: 'row', backgroundColor: '#eee', borderRadius: 20, padding: 4 },
  segmentBtn: { paddingVertical: 6, paddingHorizontal: 20, borderRadius: 16 },
  activeSegment: { backgroundColor: '#fff', elevation: 2 },
  segmentText: { fontWeight: '600', color: '#999' },
  activeSegmentText: { color: '#1A1A1A' },
  
  content: { flex: 1, paddingHorizontal: 24 }, 
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#888', marginBottom: 10, marginTop: 10, textTransform: 'uppercase' },
  
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  activeChip: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  activeChipText: { color: '#fff' },
  inactiveChip: { backgroundColor: '#fff' },
  inactiveChipText: { color: '#555' },
  
  // --- DATE PICKER ---
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, backgroundColor: '#fff', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  dateBtn: { flex: 1, padding: 5 },
  dateLabel: { fontSize: 10, color: '#888', textTransform: 'uppercase' },
  dateValue: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginTop: 2 },

  // --- UPDATED: CLEAN TOTAL CARD (Matches App UI) ---
  totalCard: {
    backgroundColor: '#fff', // White Background (Matches other cards)
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    
    // Soft Shadow (Elevation)
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },

    // Thin Border
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  
  totalLabel: { 
    color: '#888', // Grey Label
    fontSize: 12, 
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  
  filterInfo: { 
    color: '#1A1A1A', // Black Text for filters
    fontSize: 11, 
    marginTop: 4, 
    fontWeight: '500',
    maxWidth: 150 
  },
  
  totalValue: { 
    color: '#1A1A1A', // Black Amount (High Contrast)
    fontSize: 28, 
    fontWeight: '800' // Extra Bold
  },

  // --- LIST ITEMS ---
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemAmount: { fontSize: 16, fontWeight: 'bold', color: '#FF5252' },
  itemDate: { fontSize: 12, color: '#999', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 30 },
});