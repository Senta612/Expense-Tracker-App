import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { Text, FAB, IconButton, Surface, Modal, Portal, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext'; 

// --- CHANGED: Import the new "Short" Component ---
import Short from '../components/Short'; 

export default function HomeScreen({ navigation }) {
  const { getFilteredExpenses, deleteExpense, username } = useExpenses();
  
  // States
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- SORT STATE ---
  const [sortBy, setSortBy] = useState('RECENT'); 
  const [showSortModal, setShowSortModal] = useState(false);

  // Modal States
  const [visible, setVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // 1. Get Base Data
  const initialData = getFilteredExpenses(filter);

  // 2. Apply Search
  let processedData = initialData.filter(item => {
    const query = searchQuery.toLowerCase();
    const matchesName = item.name.toLowerCase().includes(query);
    const matchesAmount = item.amount.toString().includes(query);
    return matchesName || matchesAmount;
  });

  // 3. --- APPLY SORTING LOGIC ---
  processedData.sort((a, b) => {
    if (sortBy === 'HIGH') return b.amount - a.amount; // Large First
    if (sortBy === 'LOW') return a.amount - b.amount;  // Small First
    if (sortBy === 'OLD') return new Date(a.date) - new Date(b.date); // Oldest First
    return new Date(b.date) - new Date(a.date);        // Recent First (Default)
  });

  const total = processedData.reduce((sum, item) => sum + item.amount, 0);

  // Handlers
  const openNote = (item) => { setSelectedItem(item); setModalType('NOTE'); setVisible(true); };
  const openDeleteConfirm = (item) => { setSelectedItem(item); setModalType('DELETE'); setVisible(true); };
  
  const handleSortSelect = (type) => {
    setSortBy(type);
    setShowSortModal(false);
  };

  const handleConfirmDelete = () => {
    if (selectedItem) {
      deleteExpense(selectedItem.id);
      setVisible(false);
    }
  };

  // Helper for Sort Option Row (Popup Menu)
  const SortOption = ({ label, type, icon }) => (
    <TouchableOpacity onPress={() => handleSortSelect(type)} style={styles.sortOption}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={[styles.iconBg, sortBy === type && styles.activeIconBg]}>
                <IconButton 
                  icon={icon} 
                  size={22} 
                  iconColor={sortBy === type ? "#2575fc" : "#555"} 
                  style={{ margin: 0 }}
                />
            </View>
            <Text style={[styles.sortText, sortBy === type && styles.activeSortText]}>{label}</Text>
        </View>
        {sortBy === type && <IconButton icon="check" size={20} iconColor="#2575fc" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

      {/* --- POPUP MODALS --- */}
      <Portal>
        {/* SORT MENU MODAL */}
        <Modal visible={showSortModal} onDismiss={() => setShowSortModal(false)} contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Sort Expenses</Text>
          
          <SortOption label="Recent First" type="RECENT" icon="sort-calendar-descending" />
          <SortOption label="Oldest First" type="OLD" icon="calendar-arrow-right" />
          <View style={styles.divider} />
          <SortOption label="Highest Amount" type="HIGH" icon="sort-numeric-descending" />
          <SortOption label="Lowest Amount" type="LOW" icon="sort-numeric-ascending" />

          <Button mode="contained" onPress={() => setShowSortModal(false)} style={styles.modalBtn} buttonColor="#1A1A1A" textColor="#FFF">Close</Button>
        </Modal>

        {/* DELETE/NOTE MODAL */}
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modalContainer}>
          {modalType === 'NOTE' && (
            <View>
              <Text style={styles.modalTitle}>📝 Note</Text>
              <Text style={styles.modalContent}>{selectedItem?.description}</Text>
              <Button mode="contained" onPress={() => setVisible(false)} style={styles.modalBtn} buttonColor="#1A1A1A" textColor="#FFF">Close</Button>
            </View>
          )}

          {modalType === 'DELETE' && (
            <View>
              <Text style={styles.modalTitle}>Delete Expense?</Text>
              <Text style={styles.modalContent}>Remove {selectedItem?.name}?</Text>
              <View style={styles.modalActionRow}>
                <Button mode="outlined" onPress={() => setVisible(false)} style={{ flex: 1, marginRight: 10 }} textColor="#666">Cancel</Button>
                <Button mode="contained" onPress={handleConfirmDelete} style={{ flex: 1 }} buttonColor="#FF5252" textColor="#FFF">Delete</Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Namaste, {username}</Text>
          <Text style={styles.headerTitle}>My Spending</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => navigation.navigate('Stats')} style={styles.chartButton}>
              <IconButton icon="chart-pie" iconColor="#1A1A1A" size={24} style={{ margin: 0 }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.chartButton}>
              <IconButton icon="cog" iconColor="#1A1A1A" size={24} style={{ margin: 0 }} />
            </TouchableOpacity>
        </View>
      </View>

      {/* --- BALANCE --- */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>₹{total.toLocaleString('en-IN')}</Text>
      </View>

      {/* --- SEARCH --- */}
      <View style={styles.searchContainer}>
        <IconButton icon="magnify" size={20} iconColor="#999" style={{ margin: 0 }} />
        <TextInput 
          placeholder="Search name or amount..." 
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <IconButton icon="close-circle" size={16} iconColor="#ccc" style={{ margin: 0 }} />
          </TouchableOpacity>
        )}
      </View>

      {/* --- REPLACED: USING "SHORT" COMPONENT --- */}
      <Short 
        filter={filter} 
        setFilter={setFilter} 
        activeSort={sortBy}
        onSortPress={() => setShowSortModal(true)} 
      />

      {/* --- EXPENSE LIST --- */}
      <FlatList
        data={processedData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <View style={styles.leftSection}>
              <View style={styles.iconBox}>
                <Text style={styles.iconText}>{item.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                  <Text style={{ color: '#ccc', marginHorizontal: 5 }}>•</Text>
                  <View style={styles.methodTag}>
                    <Text style={styles.methodText}>
                      {(item.paymentMode === 'UPI' && item.paymentApp) ? item.paymentApp : (item.paymentMode || 'UPI')}
                    </Text>
                  </View>
                </View>
                {item.description ? (
                  <TouchableOpacity onPress={() => openNote(item)}>
                    <Text style={styles.seeNoteText}>See Note</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
            <View style={styles.rightSection}>
              <Text style={styles.itemAmount}>-₹{item.amount}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => navigation.navigate('AddExpense', { expense: item })} style={styles.miniButton}>
                  <IconButton icon="pencil" size={16} iconColor="#666" style={{ margin: 0 }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openDeleteConfirm(item)} style={styles.miniButton}>
                  <IconButton icon="trash-can-outline" size={16} iconColor="#FF5252" style={{ margin: 0 }} />
                </TouchableOpacity>
              </View>
            </View>
          </Surface>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>{searchQuery ? `No results.` : "No expenses found ✨"}</Text>}
      />

      <FAB icon="plus" color="#fff" style={styles.fab} onPress={() => navigation.navigate('AddExpense')} />
      <FAB icon="filter-variant" color="#fff" style={styles.fabLeft} onPress={() => navigation.navigate('Filter')} />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, marginBottom: 20 },
  greeting: { fontSize: 14, color: '#888', fontWeight: '500' },
  headerTitle: { fontSize: 24, color: '#1A1A1A', fontWeight: 'bold' },
  chartButton: { backgroundColor: '#fff', borderRadius: 50, padding: 6, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  balanceCard: { marginHorizontal: 24, marginBottom: 15 },
  balanceLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  balanceAmount: { fontSize: 42, color: '#1A1A1A', fontWeight: '800' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 24, marginBottom: 15, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16, color: '#1A1A1A', paddingVertical: 8, marginLeft: 5 },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginBottom: 12, padding: 16, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { backgroundColor: '#F3F4F6', borderRadius: 12, width: 45, height: 45, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  iconText: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  itemTitle: { color: '#1A1A1A', fontSize: 16, fontWeight: '600' },
  itemCategory: { color: '#999', fontSize: 12, marginTop: 2 },
  methodTag: { backgroundColor: '#f0f0f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  methodText: { fontSize: 10, fontWeight: 'bold', color: '#666' },
  seeNoteText: { color: '#2575fc', fontSize: 12, fontWeight: '600', marginTop: 4 },
  rightSection: { alignItems: 'flex-end' },
  itemAmount: { color: '#FF5252', fontSize: 16, fontWeight: '700', marginBottom: 5 },
  actionRow: { flexDirection: 'row', marginTop: 4 },
  miniButton: { padding: 0, marginLeft: 0 },
  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 50 },
  fab: { position: 'absolute', margin: 20, right: 0, bottom: 0, backgroundColor: '#1A1A1A', borderRadius: 16 },
  fabLeft: { position: 'absolute', margin: 20, left: 0, bottom: 0, backgroundColor: '#1A1A1A', borderRadius: 16 },
  
  // MODAL STYLES
  modalContainer: { backgroundColor: 'white', padding: 24, margin: 24, borderRadius: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#1A1A1A' },
  modalContent: { fontSize: 16, color: '#555', marginBottom: 20, lineHeight: 22 },
  modalBtn: { borderRadius: 12, marginTop: 15 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  
  // SORT ROW STYLES (PREMIUM LOOK)
  sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  iconBg: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activeIconBg: { backgroundColor: '#E3F2FD' }, // Light Blue when active
  sortText: { fontSize: 16, color: '#333', fontWeight: '500' },
  activeSortText: { color: '#2575fc', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 }
});