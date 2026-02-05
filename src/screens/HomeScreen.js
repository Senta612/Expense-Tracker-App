import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { Text, FAB, IconButton, Surface, Modal, Portal, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';

export default function HomeScreen({ navigation }) {
  // Get functions and data from Context
  const { getFilteredExpenses, deleteExpense, username } = useExpenses();
  
  // Local State
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [visible, setVisible] = useState(false);
  const [modalType, setModalType] = useState(null); // 'NOTE' or 'DELETE'
  const [selectedItem, setSelectedItem] = useState(null);

  // 1. Get Base Data (Day/Week/Month)
  const initialData = getFilteredExpenses(filter);

  // 2. Apply Search Filter (Name OR Amount)
  const data = initialData.filter(item => {
    const query = searchQuery.toLowerCase();
    const matchesName = item.name.toLowerCase().includes(query);
    const matchesAmount = item.amount.toString().includes(query);
    return matchesName || matchesAmount;
  });

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  // --- Modal Handlers ---
  const openNote = (item) => {
    setSelectedItem(item);
    setModalType('NOTE');
    setVisible(true);
  };

  const openDeleteConfirm = (item) => {
    setSelectedItem(item);
    setModalType('DELETE');
    setVisible(true);
  };

  const handleConfirmDelete = () => {
    if (selectedItem) {
      deleteExpense(selectedItem.id);
      setVisible(false);
    }
  };

  const hideModal = () => setVisible(false);

  // --- Components ---
  const FilterTab = ({ title }) => (
    <TouchableOpacity onPress={() => setFilter(title)} style={[styles.filterTab, filter === title ? styles.activeTab : styles.inactiveTab]}>
      <Text style={[styles.filterText, filter === title ? styles.activeText : styles.inactiveText]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

      {/* --- POPUP MODAL (Portal) --- */}
      <Portal>
        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.modalContainer}>
          
          {/* Note Popup */}
          {modalType === 'NOTE' && (
            <View>
              <Text style={styles.modalTitle}>📝 Note</Text>
              <Text style={styles.modalContent}>{selectedItem?.description}</Text>
              <Button mode="contained" onPress={hideModal} style={styles.modalBtn} buttonColor="#1A1A1A" textColor="#FFF">
                Close
              </Button>
            </View>
          )}

          {/* Delete Popup */}
          {modalType === 'DELETE' && (
            <View>
              <Text style={styles.modalTitle}>Delete Expense?</Text>
              <Text style={styles.modalContent}>Are you sure you want to remove {selectedItem?.name}?</Text>
              <View style={styles.modalActionRow}>
                <Button mode="outlined" onPress={hideModal} style={{ flex: 1, marginRight: 10 }} textColor="#666">
                  Cancel
                </Button>
                <Button mode="contained" onPress={handleConfirmDelete} style={{ flex: 1 }} buttonColor="#FF5252" textColor="#FFF">
                  Delete
                </Button>
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
            {/* Stats Button */}
            <TouchableOpacity onPress={() => navigation.navigate('Stats')} style={styles.chartButton}>
              <IconButton icon="chart-pie" iconColor="#1A1A1A" size={24} style={{ margin: 0 }} />
            </TouchableOpacity>

            {/* Settings Button */}
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.chartButton}>
              <IconButton icon="cog" iconColor="#1A1A1A" size={24} style={{ margin: 0 }} />
            </TouchableOpacity>
        </View>
      </View>

      {/* --- BALANCE CARD --- */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>₹{total.toLocaleString('en-IN')}</Text>
      </View>

      {/* --- SEARCH BAR --- */}
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

      {/* --- FILTER TABS --- */}
      <View style={styles.tabsContainer}>
        {['Day', 'Week', 'Month', 'All'].map(t => <FilterTab key={t} title={t} />)}
      </View>

      {/* --- EXPENSE LIST --- */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            
            {/* Left Section */}
            <View style={styles.leftSection}>
              <View style={styles.iconBox}>
                <Text style={styles.iconText}>{item.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.itemTitle}>{item.name}</Text>
                
                {/* Category + Payment Mode Badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                  
                  {/* Dot Separator */}
                  <Text style={{ color: '#ccc', marginHorizontal: 5 }}>•</Text>
                  
                  {/* Payment Badge (e.g. GPay, Cash) */}
                  <View style={styles.methodTag}>
                    <Text style={styles.methodText}>
                      {(item.paymentMode === 'UPI' && item.paymentApp) ? item.paymentApp : (item.paymentMode || 'UPI')}
                    </Text>
                  </View>
                </View>

                {/* Note Link */}
                {item.description ? (
                  <TouchableOpacity onPress={() => openNote(item)}>
                    <Text style={styles.seeNoteText}>See Note</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Right Section */}
            <View style={styles.rightSection}>
              <Text style={styles.itemAmount}>-₹{item.amount}</Text>
              
              <View style={styles.actionRow}>
                {/* Edit */}
                <TouchableOpacity onPress={() => navigation.navigate('AddExpense', { expense: item })} style={styles.miniButton}>
                  <IconButton icon="pencil" size={16} iconColor="#666" style={{ margin: 0 }} />
                </TouchableOpacity>

                {/* Delete */}
                <TouchableOpacity onPress={() => openDeleteConfirm(item)} style={styles.miniButton}>
                  <IconButton icon="trash-can-outline" size={16} iconColor="#FF5252" style={{ margin: 0 }} />
                </TouchableOpacity>
              </View>
            </View>

          </Surface>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery ? `No results for "${searchQuery}"` : "No expenses found ✨"}
          </Text>
        }
      />

      {/* --- FAB (Add Expense) --- */}
      <FAB 
        icon="plus" 
        color="#fff" 
        style={styles.fab} 
        onPress={() => navigation.navigate('AddExpense')} 
      />

      {/* --- LEFT FAB (Filter Screen) --- */}
      <FAB 
        icon="filter-variant" 
        color="#fff" 
        style={styles.fabLeft} 
        onPress={() => navigation.navigate('Filter')} 
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  // Header & Icons
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, marginBottom: 20 },
  greeting: { fontSize: 14, color: '#888', fontWeight: '500' },
  headerTitle: { fontSize: 24, color: '#1A1A1A', fontWeight: 'bold' },
  chartButton: { backgroundColor: '#fff', borderRadius: 50, padding: 6, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },

  // Balance
  balanceCard: { marginHorizontal: 24, marginBottom: 15 },
  balanceLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  balanceAmount: { fontSize: 42, color: '#1A1A1A', fontWeight: '800' },

  // Search Bar
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 24, marginBottom: 15, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16, color: '#1A1A1A', paddingVertical: 8, marginLeft: 5 },

  // Tabs
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 15 },
  filterTab: { marginRight: 15, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#fff' },
  activeTab: { backgroundColor: '#1A1A1A' },
  inactiveTab: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
  filterText: { fontSize: 13, fontWeight: '600' },
  activeText: { color: '#fff' },
  inactiveText: { color: '#888' },

  // List & Cards
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginBottom: 12, padding: 16, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { backgroundColor: '#F3F4F6', borderRadius: 12, width: 45, height: 45, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  iconText: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  
  itemTitle: { color: '#1A1A1A', fontSize: 16, fontWeight: '600' },
  itemCategory: { color: '#999', fontSize: 12, marginTop: 2 },
  
  // Payment Method Tag
  methodTag: { backgroundColor: '#f0f0f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  methodText: { fontSize: 10, fontWeight: 'bold', color: '#666' },

  seeNoteText: { color: '#2575fc', fontSize: 12, fontWeight: '600', marginTop: 4 },

  rightSection: { alignItems: 'flex-end' },
  itemAmount: { color: '#FF5252', fontSize: 16, fontWeight: '700', marginBottom: 5 },
  actionRow: { flexDirection: 'row', marginTop: 4 },
  miniButton: { padding: 0, marginLeft: 0 },

  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 50 },

  // FABs
  fab: { position: 'absolute', margin: 20, right: 0, bottom: 0, backgroundColor: '#1A1A1A', borderRadius: 16 },
  fabLeft: { position: 'absolute', margin: 20, left: 0, bottom: 0, backgroundColor: '#1A1A1A', borderRadius: 16 },

  // Modal Styles
  modalContainer: { backgroundColor: 'white', padding: 24, margin: 24, borderRadius: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#1A1A1A' },
  modalContent: { fontSize: 16, color: '#555', marginBottom: 20, lineHeight: 22 },
  modalBtn: { borderRadius: 12, marginTop: 5 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between' },
});