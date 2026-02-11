import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, StatusBar, TextInput, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Text, FAB, IconButton, Surface, Modal, Portal, Button, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';
import Short from '../components/Short';

// Enable Animations on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen({ navigation }) {
  // 1. Get Colors & Data from Context
  const {
    getFilteredExpenses, deleteExpense, username,
    currency, budget, getTotalSpent, colors, isDark
  } = useExpenses();

  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('RECENT');
  const [showSortModal, setShowSortModal] = useState(false);

  // Modal States
  const [visible, setVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // --- ANIMATION HANDLERS ---
  const handleFilterChange = (newFilter) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilter(newFilter);
  };

  const handleConfirmDelete = () => {
    if (selectedItem) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); // Animate removal
      deleteExpense(selectedItem.id);
      setVisible(false);
    }
  };

  // --- SMART ICON / DATE LOGIC ---
  const renderLeftBox = (item) => {
    const isTodayFilter = filter === 'Today' || filter === 'Day';
    const isWeekFilter = filter === 'Week' || filter === '7 Days';

    // A. TODAY: Show Icon
    if (isTodayFilter) {
      const iconMap = {
        'Food': 'silverware-fork-knife', 'Travel': 'car', 'Bills': 'file-document-outline',
        'Shopping': 'shopping', 'Health': 'medical-bag', 'Other': 'dots-horizontal'
      };
      const iconName = iconMap[item.category];

      if (iconName) return <IconButton icon={iconName} size={24} iconColor={colors.text} style={{ margin: 0 }} />;
      return <Text style={[styles.iconText, { color: colors.text }]}>{item.category.charAt(0).toUpperCase()}</Text>;
    }

    const dateObj = new Date(item.date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dateNum = dateObj.getDate();

    // B. WEEK: Show Day Name
    if (isWeekFilter) return <Text style={[styles.dateTextBig, { color: colors.text }]}>{dayName}</Text>;

    // C. MONTH: Show Date & Day
    return (
      <View style={{ alignItems: 'center' }}>
        <Text style={[styles.dateTextNum, { color: colors.text }]}>{dateNum}</Text>
        <Text style={[styles.dateTextDay, { color: colors.textSec }]}>{dayName}</Text>
      </View>
    );
  };

  // 2. Process Data
  const initialData = getFilteredExpenses(filter);
  let processedData = initialData.filter(item => {
    const query = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(query) || item.amount.toString().includes(query);
  });

  processedData.sort((a, b) => {
    if (sortBy === 'HIGH') return b.amount - a.amount;
    if (sortBy === 'LOW') return a.amount - b.amount;
    if (sortBy === 'OLD') return new Date(a.date) - new Date(b.date);
    return new Date(b.date) - new Date(a.date);
  });

  const totalFiltered = processedData.reduce((sum, item) => sum + item.amount, 0);
  const totalGlobalSpent = getTotalSpent();
  const availableBalance = (parseFloat(budget) || 0) - totalGlobalSpent;

  // Handlers
  const openNote = (item) => { setSelectedItem(item); setModalType('NOTE'); setVisible(true); };
  const openDeleteConfirm = (item) => { setSelectedItem(item); setModalType('DELETE'); setVisible(true); };
  const handleSortSelect = (type) => { setSortBy(type); setShowSortModal(false); };

  const SortOption = ({ label, type, icon }) => (
    <TouchableOpacity onPress={() => handleSortSelect(type)} style={styles.sortOption}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.iconBg, { backgroundColor: colors.chip }, sortBy === type && { backgroundColor: colors.inputBg }]}>
          <IconButton icon={icon} size={22} iconColor={sortBy === type ? colors.primary : colors.textSec} style={{ margin: 0 }} />
        </View>
        <Text style={[styles.sortText, { color: colors.text }, sortBy === type && { color: colors.primary, fontWeight: 'bold' }]}>{label}</Text>
      </View>
      {sortBy === type && <IconButton icon="check" size={20} iconColor={colors.primary} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* MODALS */}
      <Portal>
        <Modal visible={showSortModal} onDismiss={() => setShowSortModal(false)} contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Sort Expenses</Text>
          <SortOption label="Recent First" type="RECENT" icon="sort-calendar-descending" />
          <SortOption label="Oldest First" type="OLD" icon="calendar-arrow-right" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SortOption label="Highest Amount" type="HIGH" icon="sort-numeric-descending" />
          <SortOption label="Lowest Amount" type="LOW" icon="sort-numeric-ascending" />
          <Button mode="contained" onPress={() => setShowSortModal(false)} style={styles.modalBtn} buttonColor={colors.primary} textColor="#FFF">Close</Button>
        </Modal>

        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          {modalType === 'NOTE' && (
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>📝 Note</Text>
              <Text style={[styles.modalContent, { color: colors.textSec }]}>{selectedItem?.description}</Text>
              <Button mode="contained" onPress={() => setVisible(false)} style={styles.modalBtn} buttonColor={colors.primary} textColor="#FFF">Close</Button>
            </View>
          )}

          {modalType === 'DELETE' && (
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Expense?</Text>
              <Text style={[styles.modalContent, { color: colors.textSec }]}>Remove {selectedItem?.name}?</Text>
              <View style={styles.modalActionRow}>
                <Button mode="outlined" onPress={() => setVisible(false)} style={{ flex: 1, marginRight: 10, borderColor: colors.border }} textColor={colors.textSec}>Cancel</Button>
                <Button mode="contained" onPress={handleConfirmDelete} style={{ flex: 1 }} buttonColor={colors.error} textColor="#FFF">Delete</Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSec }]}>Namaste, {username}</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Spending</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          
          {/* 🔔 NOTIFICATION BUTTON (Matched Style) */}
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={[styles.chartButton, { backgroundColor: colors.surface }]}>
             <IconButton icon="bell-outline" iconColor={colors.text} size={24} style={{ margin: 0 }} />
          </TouchableOpacity>

          {/* 📊 CHART BUTTON */}
          <TouchableOpacity onPress={() => navigation.navigate('Stats')} style={[styles.chartButton, { backgroundColor: colors.surface }]}>
            <IconButton icon="chart-pie" iconColor={colors.text} size={24} style={{ margin: 0 }} />
          </TouchableOpacity>

          {/* ⚙️ SETTINGS BUTTON */}
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.chartButton, { backgroundColor: colors.surface }]}>
            <IconButton icon="cog" iconColor={colors.text} size={24} style={{ margin: 0 }} />
          </TouchableOpacity>

        </View>
      </View>

      {/* BALANCE CARD */}
      <View style={[styles.balanceCard, { backgroundColor: colors.surface }]}>
        <View>
          <Text style={[styles.balanceLabel, { color: colors.textSec }]}>Spent</Text>
          <Text style={[styles.balanceAmount, { color: colors.error }]}>-{currency}{totalFiltered.toLocaleString('en-IN')}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.balanceLabel, { color: colors.textSec }]}>Available</Text>
          <Text style={[styles.balanceAmount, { color: availableBalance < 0 ? colors.error : colors.success }]}>
            {currency}{availableBalance.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* SEARCH */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <IconButton icon="magnify" size={20} iconColor={colors.textSec} style={{ margin: 0 }} />
        <TextInput
          placeholder="Search name or amount..."
          placeholderTextColor={colors.textSec}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: colors.text }]}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <IconButton icon="close-circle" size={16} iconColor={colors.textSec} style={{ margin: 0 }} />
          </TouchableOpacity>
        )}
      </View>

      {/* FILTER BUTTONS */}
      <Short
        filter={filter}
        setFilter={handleFilterChange}
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
          <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={1}>
            <View style={styles.leftSection}>
              <View style={[styles.iconBox, { backgroundColor: colors.chip }]}>
                {renderLeftBox(item)}
              </View>
              <View>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.itemCategory, { color: colors.textSec }]}>{item.category}</Text>
                  <Text style={{ color: colors.textSec, marginHorizontal: 5 }}>•</Text>
                  <View style={[styles.methodTag, { backgroundColor: colors.inputBg }]}>
                    <Text style={[styles.methodText, { color: colors.textSec }]}>
                      {(item.paymentMode === 'UPI' && item.paymentApp) ? item.paymentApp : (item.paymentMode || 'UPI')}
                    </Text>
                  </View>
                </View>
                {item.description ? (
                  <TouchableOpacity onPress={() => openNote(item)}>
                    <Text style={[styles.seeNoteText, { color: colors.primary }]}>See Note</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <View style={styles.rightSection}>
              <Text style={[styles.itemAmount, { color: colors.error }]}>-{currency}{item.amount}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => navigation.navigate('AddExpense', { expense: item })} style={styles.miniButton}>
                  <IconButton icon="pencil" size={16} iconColor={colors.textSec} style={{ margin: 0 }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openDeleteConfirm(item)} style={styles.miniButton}>
                  <IconButton icon="trash-can-outline" size={16} iconColor={colors.error} style={{ margin: 0 }} />
                </TouchableOpacity>
              </View>
            </View>
          </Surface>
        )}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSec }]}>{searchQuery ? `No results.` : "No expenses found ✨"}</Text>}
      />

      {/* AI BOT BUTTON */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Chat')}
        style={[styles.aiPill, { backgroundColor: colors.surface }]}
        activeOpacity={0.8}
      >
        <Avatar.Icon size={24} icon="robot" style={{ backgroundColor: 'transparent', margin: 0 }} color={colors.primary} />
        <Text style={[styles.aiText, { color: colors.text }]}>Ask FinBot</Text>
      </TouchableOpacity>

      <FAB icon="plus" color="#fff" style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('AddExpense')} />
      <FAB icon="filter-variant" color="#fff" style={[styles.fabLeft, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Filter')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, marginBottom: 20 },
  greeting: { fontSize: 14, fontWeight: '500' },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  chartButton: { borderRadius: 50, padding: 6, elevation: 3 }, // Keeps all top buttons same size

  balanceCard: { marginHorizontal: 24, marginBottom: 15, padding: 20, borderRadius: 16, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmount: { fontSize: 26, fontWeight: '800' },

  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 15, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 8, marginLeft: 5 },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },

  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: 16, borderRadius: 16, elevation: 2 },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { borderRadius: 12, width: 48, height: 48, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  iconText: { fontSize: 20, fontWeight: 'bold' },
  dateTextBig: { fontSize: 14, fontWeight: 'bold' },
  dateTextNum: { fontSize: 16, fontWeight: 'bold', lineHeight: 18 },
  dateTextDay: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },

  itemTitle: { fontSize: 16, fontWeight: '600' },
  itemCategory: { fontSize: 12, marginTop: 2 },
  methodTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  methodText: { fontSize: 10, fontWeight: 'bold' },
  seeNoteText: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  rightSection: { alignItems: 'flex-end' },
  itemAmount: { fontSize: 16, fontWeight: '700', marginBottom: 5 },
  actionRow: { flexDirection: 'row', marginTop: 4 },
  miniButton: { padding: 0, marginLeft: 0 },
  emptyText: { textAlign: 'center', marginTop: 50 },
  fab: { position: 'absolute', margin: 20, right: 0, bottom: 0, borderRadius: 16 },
  fabLeft: { position: 'absolute', margin: 20, left: 0, bottom: 0, borderRadius: 16 },

  modalContainer: { padding: 24, margin: 24, borderRadius: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  modalContent: { fontSize: 16, marginBottom: 20, lineHeight: 22 },
  modalBtn: { borderRadius: 12, marginTop: 15 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between' },

  sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  iconBg: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sortText: { fontSize: 16, fontWeight: '500' },
  divider: { height: 1, marginVertical: 8 },

  aiPill: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 10,
  },
  aiText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  }
});