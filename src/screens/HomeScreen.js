import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, StatusBar, TextInput, LayoutAnimation, Platform, UIManager, Animated, Modal } from 'react-native';
import { Text, FAB, IconButton, Surface, Portal, Button, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';
import Short from '../components/Short';

// Enable Physics Animations (Spring)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- 1. BOUNCY CUSTOM ALERT (Same as Notification Screen) ---
const CustomAlert = ({ visible, onClose, onConfirm, item, colors }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showModal, setShowModal] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true })
      ]).start();
    } else {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 0.8, duration: 150, useNativeDriver: true })
        ]).start(() => setShowModal(false));
    }
  }, [visible]);

  if (!showModal) return null;

  return (
    <Modal transparent visible={showModal} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.alertBox, { backgroundColor: colors.surface, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={[styles.alertIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <IconButton icon="trash-can" size={32} iconColor={colors.error} style={{margin: 0}} />
            </View>
            <Text style={[styles.alertTitle, { color: colors.text }]}>Delete Expense?</Text>
            <Text style={[styles.alertDesc, { color: colors.textSec }]}>
                Remove <Text style={{fontWeight: 'bold'}}>{item?.name}</Text> permanently?
            </Text>
            
            <View style={styles.alertBtnRow}>
                <Button mode="text" onPress={onClose} textColor={colors.textSec} style={{flex: 1}}>Cancel</Button>
                <Button mode="contained" onPress={onConfirm} buttonColor={colors.error} style={{flex: 1, borderRadius: 12}}>Delete</Button>
            </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function HomeScreen({ navigation }) {
  // 1. Get Colors & Data
  const {
    getFilteredExpenses, deleteExpense, username,
    currency, budget, getTotalSpent, colors, isDark
  } = useExpenses();

  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('RECENT');
  const [showSortModal, setShowSortModal] = useState(false);

  // Expanded Card State
  const [expandedId, setExpandedId] = useState(null);

  // Delete Alert State
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // --- 2. PHYSICS ANIMATION CONFIG ---
  const animateLayout = () => {
    LayoutAnimation.configureNext({
      duration: 500,
      create: { type: LayoutAnimation.Types.spring, property: LayoutAnimation.Properties.scaleXY, springDamping: 0.7 },
      update: { type: LayoutAnimation.Types.spring, springDamping: 0.7 },
      delete: { type: LayoutAnimation.Types.linear, property: LayoutAnimation.Properties.opacity, duration: 200 }
    });
  };

  const handleFilterChange = (newFilter) => {
    animateLayout();
    setFilter(newFilter);
    setExpandedId(null);
  };

  const toggleExpand = (id) => {
    animateLayout();
    setExpandedId(expandedId === id ? null : id);
  };

  // --- DELETE LOGIC ---
  const confirmDelete = (item) => {
    setItemToDelete(item);
    setDeleteVisible(true);
  };

  const performDelete = () => {
    if (itemToDelete) {
      setDeleteVisible(false);
      // Wait for modal animation to finish before removing item from list
      setTimeout(() => {
          animateLayout();
          deleteExpense(itemToDelete.id);
          setItemToDelete(null);
          setExpandedId(null);
      }, 200);
    }
  };

  // --- 🧠 SMART ICON / DATE LOGIC (Preserved from your code) ---
  const renderLeftBox = (item) => {
    const isTodayFilter = filter === 'Today' || filter === 'Day';
    const isWeekFilter = filter === 'Week' || filter === '7 Days';

    // A. TODAY: Show Category Icon
    if (isTodayFilter) {
      const iconMap = {
        'Food': 'silverware-fork-knife', 'Travel': 'car', 'Bills': 'file-document-outline',
        'Shopping': 'shopping', 'Health': 'medical-bag', 'Other': 'dots-horizontal',
        'Entertainment': 'movie-open', 'Education': 'school', 'Investment': 'chart-line'
      };
      const iconName = iconMap[item.category] || 'cash';
      return <IconButton icon={iconName} size={24} iconColor={colors.text} style={{ margin: 0 }} />;
    }

    const dateObj = new Date(item.date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dateNum = dateObj.getDate();

    // B. WEEK: Show Day Name (Mon, Tue)
    if (isWeekFilter) return <Text style={[styles.dateTextBig, { color: colors.text }]}>{dayName}</Text>;

    // C. MONTH/ALL: Show Date Number & Day
    return (
      <View style={{ alignItems: 'center' }}>
        <Text style={[styles.dateTextNum, { color: colors.text }]}>{dateNum}</Text>
        <Text style={[styles.dateTextDay, { color: colors.textSec }]}>{dayName}</Text>
      </View>
    );
  };

  // Process Data
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

  // --- SORT MODAL ---
  const SortOption = ({ label, type, icon }) => (
    <TouchableOpacity onPress={() => { setSortBy(type); setShowSortModal(false); }} style={styles.sortOption}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.iconBg, { backgroundColor: colors.chip }, sortBy === type && { backgroundColor: colors.inputBg }]}>
          <IconButton icon={icon} size={22} iconColor={sortBy === type ? colors.primary : colors.textSec} style={{margin:0}} />
        </View>
        <Text style={[styles.sortText, { color: colors.text }, sortBy === type && { color: colors.primary, fontWeight: 'bold' }]}>{label}</Text>
      </View>
      {sortBy === type && <IconButton icon="check" size={20} iconColor={colors.primary} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSec }]}>Namaste, {username}</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Spending</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={[styles.chartButton, { backgroundColor: colors.surface }]}>
             <IconButton icon="bell-outline" iconColor={colors.text} size={24} style={{ margin: 0 }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Stats')} style={[styles.chartButton, { backgroundColor: colors.surface }]}>
            <IconButton icon="chart-pie" iconColor={colors.text} size={24} style={{ margin: 0 }} />
          </TouchableOpacity>
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

      {/* EXPENSE LIST */}
      <FlatList
        data={processedData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingTop: 15 }]} 
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isOpen = expandedId === item.id;
          
          return (
            <Surface 
                style={[
                    styles.card, 
                    { 
                        backgroundColor: colors.surface, 
                        borderColor: isOpen ? colors.primary : 'transparent',
                        borderWidth: isOpen ? 1 : 0,
                        elevation: isOpen ? 6 : 1,
                        transform: [{ scale: isOpen ? 1.02 : 1 }]
                    }
                ]} 
            >
              {/* HEADER (Clickable) */}
              <TouchableOpacity activeOpacity={0.9} onPress={() => toggleExpand(item.id)} style={styles.cardHeader}>
                
                {/* 1. LEFT BOX (Smart Icon/Date) */}
                <View style={[styles.iconBox, { backgroundColor: colors.chip }]}>
                    {renderLeftBox(item)}
                </View>

                {/* 2. MIDDLE DETAILS */}
                <View style={{flex: 1, paddingHorizontal: 12}}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{item.name}</Text>
                    {!isOpen && (
                         <Text style={[styles.itemCategory, { color: colors.textSec }]}>
                            {item.category} • {(item.paymentMode === 'UPI' && item.paymentApp) ? item.paymentApp : (item.paymentMode || 'UPI')}
                         </Text>
                    )}
                </View>

                {/* 3. RIGHT AMOUNT */}
                <View style={{alignItems: 'flex-end'}}>
                    <Text style={[styles.itemAmount, { color: colors.error }]}>-{currency}{item.amount}</Text>
                    {isOpen ? (
                        <IconButton icon="chevron-up" size={20} iconColor={colors.primary} style={{margin: 0, marginTop: 4}} />
                    ) : (
                        <Text style={{fontSize: 10, color: colors.textSec, marginTop: 4}}>
                            {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Text>
                    )}
                </View>
              </TouchableOpacity>

              {/* EXPANDED CONTENT (Note & Actions) */}
              {isOpen && (
                  <View style={styles.expandedContent}>
                      <View style={[styles.divider, {backgroundColor: colors.border}]} />
                      
                      {/* INFO GRID */}
                      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15}}>
                          <View style={{flex: 1}}>
                              <Text style={{color: colors.textSec, fontSize: 10, marginBottom: 2}}>CATEGORY</Text>
                              <Text style={{color: colors.text, fontWeight: 'bold', fontSize: 13}}>{item.category}</Text>
                          </View>
                          <View style={{flex: 1}}>
                               <Text style={{color: colors.textSec, fontSize: 10, marginBottom: 2}}>PAYMENT</Text>
                               <Text style={{color: colors.text, fontWeight: 'bold', fontSize: 13}}>
                                  {(item.paymentMode === 'UPI' && item.paymentApp) ? item.paymentApp : (item.paymentMode || 'UPI')}
                               </Text>
                          </View>
                      </View>

                      {/* FULL DATE */}
                      <View style={{marginBottom: 15}}>
                          <Text style={{color: colors.textSec, fontSize: 10, marginBottom: 2}}>FULL DATE</Text>
                          <Text style={{color: colors.text, fontSize: 13, fontWeight: '500'}}>
                              {new Date(item.date).toDateString()} at {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </Text>
                      </View>

                      {/* NOTE BOX */}
                      {item.description ? (
                        <View style={styles.noteBox}>
                            <Text style={{color: colors.textSec, fontSize: 10, marginBottom: 4, fontWeight: 'bold'}}>NOTE</Text>
                            <Text style={{color: colors.text, fontSize: 14, lineHeight: 20}}>{item.description}</Text>
                        </View>
                      ) : (
                        <Text style={{color: colors.textSec, fontSize: 12, fontStyle: 'italic', marginBottom: 15}}>No notes added.</Text>
                      )}

                      {/* ACTIONS */}
                      <View style={styles.actionRow}>
                          <Button 
                             mode="outlined" 
                             onPress={() => confirmDelete(item)} 
                             style={{flex: 1, borderColor: colors.error, borderRadius: 12, marginRight: 10, borderWidth: 1}} 
                             textColor={colors.error}
                             icon="trash-can-outline"
                          >
                             Delete
                          </Button>
                          
                          <Button 
                             mode="contained" 
                             onPress={() => navigation.navigate('AddExpense', { expense: item })} 
                             style={{flex: 1, borderRadius: 12}} 
                             buttonColor={colors.primary}
                             textColor="#FFF"
                             icon="pencil"
                          >
                             Edit
                          </Button>
                      </View>
                  </View>
              )}
            </Surface>
          );
        }}
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
      </Portal>

      {/* CUSTOM ALERT (Outside Portal for Animation) */}
      <CustomAlert 
        visible={deleteVisible} 
        onClose={() => setDeleteVisible(false)} 
        onConfirm={performDelete} 
        item={itemToDelete}
        colors={colors}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, marginBottom: 20 },
  greeting: { fontSize: 14, fontWeight: '500' },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  chartButton: { borderRadius: 50, padding: 6, elevation: 3 },

  balanceCard: { marginHorizontal: 24, marginBottom: 15, padding: 20, borderRadius: 16, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmount: { fontSize: 26, fontWeight: '800' },

  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 15, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 8, marginLeft: 5 },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },

  // CARD STYLES
  card: { borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  
  // Icon Box size matches original logic
  iconBox: { borderRadius: 12, width: 48, height: 48, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  
  // Date/Icon Text Styles (from original code)
  dateTextBig: { fontSize: 14, fontWeight: 'bold' },
  dateTextNum: { fontSize: 16, fontWeight: 'bold', lineHeight: 18 },
  dateTextDay: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  
  itemTitle: { fontSize: 16, fontWeight: '600' },
  itemCategory: { fontSize: 12, marginTop: 2 },
  itemAmount: { fontSize: 16, fontWeight: '700' },

  expandedContent: { paddingHorizontal: 16, paddingBottom: 16 },
  noteBox: { marginBottom: 15, padding: 12, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },

  emptyText: { textAlign: 'center', marginTop: 50 },
  fab: { position: 'absolute', margin: 20, right: 0, bottom: 0, borderRadius: 16 },
  fabLeft: { position: 'absolute', margin: 20, left: 0, bottom: 0, borderRadius: 16 },

  // MODAL STYLES
  modalContainer: { padding: 24, margin: 24, borderRadius: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalBtn: { borderRadius: 12, marginTop: 15 },

  // CUSTOM ALERT
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 40 },
  alertBox: { width: '100%', borderRadius: 28, padding: 24, alignItems: 'center' },
  alertIconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  alertTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  alertDesc: { fontSize: 14, textAlign: 'center', marginBottom: 24, opacity: 0.7 },
  alertBtnRow: { flexDirection: 'row', width: '100%', gap: 10 },

  sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  iconBg: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sortText: { fontSize: 16, fontWeight: '500' },
  divider: { height: 1, marginVertical: 12 },

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