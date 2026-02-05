import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from './ExpenseContext';

// --- NEW: Import the Compare Component ---
import Compare from './components/Compare';

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Other'];

export default function FilterScreen({ navigation }) {
  const { expenses } = useExpenses();
  const [activeTab, setActiveTab] = useState('Filter'); 
  const [selectedCats, setSelectedCats] = useState([]);

  const toggleCategory = (cat) => {
    if (selectedCats.includes(cat)) {
      setSelectedCats(selectedCats.filter(c => c !== cat));
    } else {
      setSelectedCats([...selectedCats, cat]);
    }
  };

  // --- Render Filter View (List) ---
  const renderFilterView = () => {
    const filteredData = expenses.filter(item => {
      if (selectedCats.length === 0) return true; 
      return selectedCats.includes(item.category);
    });

    return (
      <View style={{ flex: 1 }}>
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

        <Text style={styles.sectionTitle}>Results ({filteredData.length})</Text>
        <FlatList
          data={filteredData}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <Surface style={styles.card} elevation={1}>
              <View style={styles.row}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemAmount}>-₹{item.amount}</Text>
              </View>
              <Text style={styles.itemDate}>{new Date(item.date).toLocaleDateString()} • {item.category}</Text>
            </Surface>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No matching expenses.</Text>}
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
        {activeTab === 'Filter' ? (
            renderFilterView()
        ) : (
            // --- NEW: Using the Component ---
            <Compare expenses={expenses} />
        )}
      </View>
    </SafeAreaView>
  );
}

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
  content: { flex: 1, paddingHorizontal: 24 }, // Consistent padding
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 15, marginTop: 10, textTransform: 'uppercase' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  activeChip: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  activeChipText: { color: '#fff' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemAmount: { fontSize: 16, fontWeight: 'bold', color: '#FF5252' },
  itemDate: { fontSize: 12, color: '#999', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 30 },
});