import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { Text, FAB, IconButton, Surface, Modal, Portal, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext'; 

import Short from '../components/Short'; 

export default function HomeScreen({ navigation }) {
  // 1. Get New Context Values (currency, budget, getTotalSpent)
  const { 
    getFilteredExpenses, deleteExpense, username, 
    currency, budget, getTotalSpent 
  } = useExpenses();
  
  // States
  const [filter, setFilter] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('RECENT'); 
  const [showSortModal, setShowSortModal] = useState(false);

  // Modal States
  const [visible, setVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // --- SMART ICON / DATE LOGIC ---
  const renderLeftBox = (item) => {
    const isTodayFilter = filter === 'Today' || filter === 'Day';
    const isWeekFilter = filter === 'Week' || filter === '7 Days';
    
    // A. TODAY: Show Icon
    if (isTodayFilter) {
        const iconMap = {
            'Food': 'silverware-fork-knife', 
            'Travel': 'car',                 
            'Bills': 'file-document-outline',
            'Shopping': 'shopping',
            'Health': 'medical-bag',
            'Other': 'dots-horizontal'
        };

        const iconName = iconMap[item.category];

        if (iconName) {
            return <IconButton icon={iconName} size={24} iconColor="#1A1A1A" style={{ margin: 0 }} />;
        } else {
            return <Text style={styles.iconText}>{item.category.charAt(0).toUpperCase()}</Text>;
        }
    }

    const dateObj = new Date(item.date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }); 
    const dateNum = dateObj.getDate(); 

    // B. WEEK: Show Day Name (Mon, Tue)
    if (isWeekFilter) {
        return <Text style={styles.dateTextBig}>{dayName}</Text>;
    }

    // C. MONTH/ALL: Show Date & Day (6 FRI)
    return (
        <View style={{ alignItems: 'center' }}>
            <Text style={styles.dateTextNum}>{dateNum}</Text>
            <Text style={styles.dateTextDay}>{dayName}</Text>
        </View>
    );
  };

  // 2. Process Data
  const initialData = getFilteredExpenses(filter);
  let processedData = initialData.filter(item => {
    const query = searchQuery.toLowerCase();
    const matchesName = item.name.toLowerCase().includes(query);
    const matchesAmount = item.amount.toString().includes(query);
    return matchesName || matchesAmount;
  });

  // 3. Sort Data
  processedData.sort((a, b) => {
    if (sortBy === 'HIGH') return b.amount - a.amount;
    if (sortBy === 'LOW') return a.amount - b.amount;
    if (sortBy === 'OLD') return new Date(a.date) - new Date(b.date);
    return new Date(b.date) - new Date(a.date);
  });

  const totalFiltered = processedData.reduce((sum, item) => sum + item.amount, 0);
  
  // Calculate Available Balance (Global Budget - Global Spent)
  const totalGlobalSpent = getTotalSpent();
  const availableBalance = (parseFloat(budget) || 0) - totalGlobalSpent;

  // Handlers
  const openNote = (item) => { setSelectedItem(item); setModalType('NOTE'); setVisible(true); };
  const openDeleteConfirm = (item) => { setSelectedItem(item); setModalType('DELETE'); setVisible(true); };
  const handleSortSelect = (type) => { setSortBy(type); setShowSortModal(false); };
  const handleConfirmDelete = () => { if (selectedItem) { deleteExpense(selectedItem.id); setVisible(false); }};

  // Sort Popup Helper
  const SortOption = ({ label, type, icon }) => (
    <TouchableOpacity onPress={() => handleSortSelect(type)} style={styles.sortOption}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={[styles.iconBg, sortBy === type && styles.activeIconBg]}>
                <IconButton icon={icon} size={22} iconColor={sortBy === type ? "#2575fc" : "#555"} style={{ margin: 0 }} />
            </View>
            <Text style={[styles.sortText, sortBy === type && styles.activeSortText]}>{label}</Text>
        </View>
        {sortBy === type && <IconButton icon="check" size={20} iconColor="#2575fc" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

      {/* MODALS */}
      <Portal>
        <Modal visible={showSortModal} onDismiss={() => setShowSortModal(false)} contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Sort Expenses</Text>
          <SortOption label="Recent First" type="RECENT" icon="sort-calendar-descending" />
          <SortOption label="Oldest First" type="OLD" icon="calendar-arrow-right" />
          <View style={styles.divider} />
          <SortOption label="Highest Amount" type="HIGH" icon="sort-numeric-descending" />
          <SortOption label="Lowest Amount" type="LOW" icon="sort-numeric-ascending" />
          <Button mode="contained" onPress={() => setShowSortModal(false)} style={styles.modalBtn} buttonColor="#1A1A1A" textColor="#FFF">Close</Button>
        </Modal>

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

      {/* HEADER */}
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

      {/* --- NEW BALANCE CARD (Split View) --- */}
      <View style={styles.balanceCard}>
        {/* Left: Spent */}
        <View>
            <Text style={styles.balanceLabel}>Spent</Text>
            <Text style={styles.balanceAmount}>-{currency}{totalFiltered.toLocaleString('en-IN')}</Text>
        </View>
        
        {/* Right: Available */}
        <View style={{alignItems: 'flex-end'}}>
            <Text style={styles.balanceLabel}>Available</Text>
            <Text style={[styles.balanceAmount, { color: availableBalance < 0 ? '#FF5252' : '#00C853' }]}>
                {currency}{availableBalance.toLocaleString('en-IN')}
            </Text>
        </View>
      </View>

      {/* SEARCH */}
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

      {/* FILTER BUTTONS */}
      <Short 
        filter={filter} 
        setFilter={setFilter} 
        activeSort={sortBy}
        onSortPress={() => setShowSortModal(true)} 
      />

      {/* LIST */}
      <FlatList
        data={processedData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <View style={styles.leftSection}>
              
              {/* DYNAMIC ICON BOX */}
              <View style={styles.iconBox}>
                {renderLeftBox(item)}
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
              {/* Dynamic Currency */}
              <Text style={styles.itemAmount}>-{currency}{item.amount}</Text>
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
  
  // --- UPDATED BALANCE CARD ---
  balanceCard: { 
    marginHorizontal: 24, 
    marginBottom: 15, 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16,
    elevation: 2,
    flexDirection: 'row', // Side by Side
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  balanceLabel: { fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmount: { fontSize: 26, color: '#FF5252', fontWeight: '800' }, // Adjusted size to fit

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 24, marginBottom: 15, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16, color: '#1A1A1A', paddingVertical: 8, marginLeft: 5 },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginBottom: 12, padding: 16, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  
  iconBox: { backgroundColor: '#F3F4F6', borderRadius: 12, width: 48, height: 48, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  iconText: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  dateTextBig: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' }, 
  dateTextNum: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', lineHeight: 18 }, 
  dateTextDay: { fontSize: 10, fontWeight: '600', color: '#888', textTransform: 'uppercase' }, 

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
  modalContainer: { backgroundColor: 'white', padding: 24, margin: 24, borderRadius: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#1A1A1A' },
  modalContent: { fontSize: 16, color: '#555', marginBottom: 20, lineHeight: 22 },
  modalBtn: { borderRadius: 12, marginTop: 15 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  iconBg: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activeIconBg: { backgroundColor: '#E3F2FD' }, 
  sortText: { fontSize: 16, color: '#333', fontWeight: '500' },
  activeSortText: { color: '#2575fc', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 }
});