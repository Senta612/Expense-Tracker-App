import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, StatusBar, TextInput, LayoutAnimation, Platform, UIManager, Animated, Modal, Dimensions, Easing } from 'react-native';
import { Text, FAB, IconButton, Surface, Portal, Button, Avatar, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';
import Short from '../components/Short';

const { width, height } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FILTERS = ['All', 'Today', 'Week', 'Month', 'Year'];

// --- 1. EXPENSE CARD ---
const ExpenseCard = ({ item, index, colors, currency, isOpen, toggleExpand, onEdit, onDelete, filter }) => {
  const startX = -width;
  const slideAnim = useRef(new Animated.Value(startX)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isIncome = item.type === 'income';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, delay: index * 80, useNativeDriver: true })
    ]).start();
  }, []);

  const renderLeftBox = () => {
    const isTodayFilter = filter === 'Today' || filter === 'Day';
    const isWeekFilter = filter === 'Week' || filter === '7 Days';

    if (isIncome) return <IconButton icon="wallet-plus" size={24} iconColor={colors.success} style={{ margin: 0 }} />;
    if (isTodayFilter) {
      const iconMap = { 'Food': 'silverware-fork-knife', 'Travel': 'car', 'Bills': 'file-document-outline', 'Shopping': 'shopping', 'Health': 'medical-bag', 'Other': 'dots-horizontal', 'Entertainment': 'movie-open', 'Education': 'school', 'Investment': 'chart-line' };
      const iconName = iconMap[item.category] || 'cash';
      return <IconButton icon={iconName} size={24} iconColor={colors.text} style={{ margin: 0 }} />;
    }

    const dateObj = new Date(item.date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dateNum = dateObj.getDate();

    if (isWeekFilter) return <Text style={[styles.dateTextBig, { color: colors.text }]}>{dayName}</Text>;

    return (
      <View style={{ alignItems: 'center' }}>
        <Text style={[styles.dateTextNum, { color: colors.text }]}>{dateNum}</Text>
        <Text style={[styles.dateTextDay, { color: colors.textSec }]}>{dayName}</Text>
      </View>
    );
  };

  const renderIcon = () => {
    if (isIncome) return 'wallet-plus';
    const iconMap = { 'Food': 'silverware-fork-knife', 'Travel': 'car', 'Bills': 'file-document-outline', 'Shopping': 'shopping', 'Health': 'medical-bag', 'Other': 'dots-horizontal', 'Entertainment': 'movie-open', 'Education': 'school', 'Investment': 'chart-line' };
    return iconMap[item.category] || 'cash';
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }], marginBottom: 12 }}>
      <Surface style={[styles.card, { backgroundColor: colors.surface, borderColor: isOpen ? (isIncome ? colors.success : colors.primary) : 'transparent', borderWidth: isOpen ? 1 : 0, elevation: isOpen ? 6 : 1, transform: [{ scale: isOpen ? 1.02 : 1 }] }]}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => toggleExpand(item.id)} style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: isIncome ? colors.success + '15' : colors.chip }]}>{renderLeftBox()}</View>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={[styles.itemTitle, { color: colors.text }]}>{item.name}</Text>
            {!isOpen && <Text style={[styles.itemCategory, { color: colors.textSec }]}>{item.category} • {item.paymentMode || 'UPI'}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.itemAmount, { color: isIncome ? colors.success : colors.error }]}>
              {isIncome ? '+' : '-'}{currency}{item.amount}
            </Text>
            {isOpen ? <IconButton icon="chevron-up" size={20} iconColor={colors.primary} style={{ margin: 0, marginTop: 4 }} /> : <Text style={{ fontSize: 10, color: colors.textSec, marginTop: 4 }}>{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
          </View>
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.expandedContent}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textSec, fontSize: 10, marginBottom: 2 }}>CATEGORY</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Avatar.Icon size={20} icon={renderIcon()} style={{ backgroundColor: 'transparent', marginRight: 0 }} color={isIncome ? colors.success : colors.primary} />
                  <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 13 }}>{item.category}</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textSec, fontSize: 10, marginBottom: 2 }}>PAYMENT</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconButton icon="credit-card-outline" size={18} iconColor={colors.primary} style={{ margin: 0, marginRight: 0, marginLeft: -8 }} />
                  <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 13 }}>{item.paymentMode || 'UPI'}</Text>
                </View>
              </View>
            </View>
            <View style={{ marginBottom: 15 }}>
              <Text style={{ color: colors.textSec, fontSize: 10, marginBottom: 2 }}>FULL DATE</Text>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>{new Date(item.date).toDateString()} at {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            {item.description ? (
              <View style={styles.noteBox}>
                <Text style={{ color: colors.textSec, fontSize: 10, marginBottom: 4, fontWeight: 'bold' }}>NOTE</Text>
                <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{item.description}</Text>
              </View>
            ) : <Text style={{ color: colors.textSec, fontSize: 12, fontStyle: 'italic', marginBottom: 15 }}>No notes added.</Text>}
            <View style={styles.actionRow}>
              <Button mode="outlined" onPress={() => onDelete(item)} style={{ flex: 1, borderColor: colors.error, borderRadius: 12, marginRight: 10, borderWidth: 1 }} textColor={colors.error} icon="trash-can-outline">Delete</Button>
              <Button mode="contained" onPress={() => onEdit(item)} style={{ flex: 1, borderRadius: 12 }} buttonColor={colors.primary} textColor="#FFF" icon="pencil">Edit</Button>
            </View>
          </View>
        )}
      </Surface>
    </Animated.View>
  );
};

// --- 2. EXPENSE PAGE ---
const ExpensePage = ({ filter, searchQuery, sortBy, navigation, onConfirmDelete, parentExpandedId, setParentExpandedId }) => {
  const { getFilteredExpenses, colors, currency } = useExpenses();
  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setParentExpandedId(parentExpandedId === id ? null : id);
  };

  const initialData = getFilteredExpenses(filter);
  let processedData = initialData.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.amount.toString().includes(searchQuery.toLowerCase()));

  processedData.sort((a, b) => {
    if (sortBy === 'HIGH') return b.amount - a.amount;
    if (sortBy === 'LOW') return a.amount - b.amount;
    if (sortBy === 'OLD') return new Date(a.date) - new Date(b.date);
    return new Date(b.date) - new Date(a.date);
  });

  return (
    <View style={{ width: width }}>
      <FlatList
        data={processedData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingTop: 15 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <ExpenseCard item={item} index={index} colors={colors} currency={currency} isOpen={parentExpandedId === item.id} toggleExpand={toggleExpand} onEdit={() => navigation.navigate('AddExpense', { expense: item })} onDelete={onConfirmDelete} filter={filter} />
        )}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSec }]}>{searchQuery ? `No results.` : `No transactions for ${filter} ✨`}</Text>}
      />
    </View>
  );
};

// Screen constants for boundary checking
const SCREEN_WIDTH = Dimensions.get('window').width;
const MENU_WIDTH = 220;
const SCREEN_PADDING = 8;

// --- 3. 🌟 PROFESSIONAL ANCHORED POPUP MENU ---
const PopupMenu = ({ visible, onClose, children, triggerRef, colors }) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showModal, setShowModal] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [menuLayout, setMenuLayout] = useState({ width: 220, height: 200 });
  const triggerPosRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const popupViewRef = useRef(null);

  // Calculate position with screen boundary checking
  const calculatePosition = (triggerX, triggerY, triggerW, triggerH, menuW) => {
    let x = triggerX + triggerW - menuW; // Align right edge with trigger right
    let y = triggerY + triggerH; // Start at bottom of trigger

    // ✅ Prevent left overflow
    if (x < SCREEN_PADDING) {
      x = SCREEN_PADDING;
    }

    // ✅ Prevent right overflow
    if (x + menuW > SCREEN_WIDTH - SCREEN_PADDING) {
      x = SCREEN_WIDTH - menuW - SCREEN_PADDING;
    }

    return { x, y };
  };

  // Measure trigger position when visible changes
  useEffect(() => {
    if (visible && triggerRef?.current) {
      // Store trigger position
      triggerRef.current.measureInWindow((x, y, width, height) => {
        triggerPosRef.current = { x, y, width, height };
        const menuW = menuLayout.width || MENU_WIDTH;
        const newPos = calculatePosition(x, y, width, height, menuW);
        setPosition(newPos);
      });
      setShowModal(true);
    } else if (!visible && showModal) {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.85, duration: 150, useNativeDriver: true })
      ]).start(() => {
        setShowModal(false);
        // Reset for next open
        scaleAnim.setValue(0.85);
        fadeAnim.setValue(0);
      });
    }
  }, [visible]);

  // Animate in when modal is shown
  useEffect(() => {
    if (showModal && visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true })
      ]).start();
    }
  }, [showModal, visible]);

  // Update position when menu layout changes (for dynamic sizing) with boundary checking
  useEffect(() => {
    if (showModal && triggerPosRef.current.width > 0) {
      const { x, y, width, height } = triggerPosRef.current;
      const newPos = calculatePosition(x, y, width, height, menuLayout.width);
      setPosition(newPos);
    }
  }, [menuLayout.width, menuLayout.height, showModal]);


  const handleMenuLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setMenuLayout({ width, height });
    }
  };

  if (!showModal) return null;

  return (
    <Modal transparent visible={showModal} onRequestClose={onClose} animationType="none">
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.modalOverlay}>
        <Animated.View
          ref={popupViewRef}
          onLayout={handleMenuLayout}
          style={[
            styles.popupMenu,
            {
              backgroundColor: colors.surface,
              top: position.y,
              left: position.x,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {children}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};


// --- 4. BOTTOM SHEET ---
const BottomSheet = ({ visible, onClose, children, title, colors }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [showModal, setShowModal] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8, tension: 60 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true, easing: Easing.ease }).start(() => setShowModal(false));
    }
  }, [visible]);

  if (!showModal) return null;

  return (
    <Modal transparent visible={showModal} onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={[styles.modalOverlay, { justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
          <Animated.View style={[styles.bottomSheet, { backgroundColor: colors.surface, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 15 }]}>{title}</Text>
            {children}
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// --- 5. ALERT MODAL ---
const AlertModal = ({ visible, onClose, children, colors }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  if (!visible) return null;

  Animated.parallel([
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true })
  ]).start();

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <Animated.View style={[styles.alertBox, { backgroundColor: colors.surface, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

// --- 6. ONBOARDING TUTORIAL MODAL ---
const OnboardingTutorial = ({ visible, onComplete, colors }) => {
    const [step, setStep] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, [visible]);

    if (!visible) return null;

    const slides = [
        { title: "Welcome to FinApp! 🎉", desc: "The smartest, fastest way to track your money and stay on budget.", icon: "rocket-launch" },
        { title: "Smart Wallet 💳", desc: "Tap your Balance Card at the top of the home screen anytime to configure your Monthly or Weekly budget.", icon: "wallet-outline" },
        { title: "Meet FinBot 🤖", desc: "Don't want to fill out forms? Tap the left purple button to Ask FinBot. Just type 'Lunch 200' and it saves automatically!", icon: "robot-outline" }
    ];

    const handleNext = () => {
        if (step < slides.length - 1) setStep(step + 1);
        else {
            Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onComplete());
        }
    };

    return (
        <Modal transparent visible={visible} animationType="none">
            <Animated.View style={[styles.modalOverlay, { justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', opacity: fadeAnim }]}>
                <Surface style={[styles.onboardingCard, { backgroundColor: colors.surface }]}>
                    
                    <View style={[styles.onboardingIconBg, { backgroundColor: colors.primary + '15' }]}>
                        <IconButton icon={slides[step].icon} size={60} iconColor={colors.primary} style={{margin:0}} />
                    </View>
                    
                    <Text style={[styles.onboardingTitle, { color: colors.text }]}>{slides[step].title}</Text>
                    <Text style={[styles.onboardingDesc, { color: colors.textSec }]}>{slides[step].desc}</Text>

                    <View style={styles.dotsContainer}>
                        {slides.map((_, i) => (
                            <View key={i} style={[styles.dot, { backgroundColor: i === step ? colors.primary : colors.border, width: i === step ? 20 : 8 }]} />
                        ))}
                    </View>

                    <Button mode="contained" onPress={handleNext} buttonColor={colors.primary} textColor="#FFF" style={styles.onboardingBtn} labelStyle={{fontSize: 16, fontWeight: 'bold'}}>
                        {step === slides.length - 1 ? "Get Started" : "Next"}
                    </Button>

                </Surface>
            </Animated.View>
        </Modal>
    );
};


// --- MAIN HOME SCREEN ---
export default function HomeScreen({ navigation }) {
  const {
    deleteExpense, addExpense, username, currency, budget, budgetPeriod,
    updateBudgetConfig, getBalanceData, colors, isDark,
    isFirstLaunch, completeTutorial 
  } = useExpenses();

  const [activeFilterIndex, setActiveFilterIndex] = useState(0);
  const flatListRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('RECENT');

  // ✨ Refs to capture exact button positions for popup menus
  const headerBtnRef = useRef(null);
  const sortBtnRef = useRef(null);

  // App Menus & Modals
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget);
  const [tempPeriod, setTempPeriod] = useState(budgetPeriod || 'Monthly');

  // App States
  const [expandedId, setExpandedId] = useState(null);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [undoData, setUndoData] = useState(null);
  const undoAnim = useRef(new Animated.Value(150)).current;

  const handleFilterPress = (filterName) => {
    const index = FILTERS.indexOf(filterName);
    if (index !== -1) { setActiveFilterIndex(index); flatListRef.current?.scrollToIndex({ index, animated: true }); }
  };

  const handleHeaderMenuPress = () => {
    setHeaderMenuVisible(true);
  };

  // ✨ PERFECT SORT POSITIONING using ref
  const handleSortButtonPress = (sortRef) => { 
    if (sortRef?.current) {
      setShowSortModal(true);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => { if (viewableItems.length > 0) setActiveFilterIndex(viewableItems[0].index); }).current;
  const animateLayout = () => { LayoutAnimation.configureNext({ duration: 300, create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity }, update: { type: LayoutAnimation.Types.easeInEaseOut }, delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity } }); };

  const confirmDelete = (item) => { setItemToDelete(item); setDeleteVisible(true); };
  const performDelete = () => { if (itemToDelete) { setDeleteVisible(false); setUndoData(itemToDelete); setTimeout(() => { animateLayout(); deleteExpense(itemToDelete.id); setItemToDelete(null); setExpandedId(null); showUndo(); }, 200); } };
  const showUndo = () => { Animated.spring(undoAnim, { toValue: 0, useNativeDriver: true }).start(); setTimeout(() => hideUndo(), 4000); };
  const hideUndo = () => { Animated.timing(undoAnim, { toValue: 150, duration: 300, useNativeDriver: true }).start(() => setUndoData(null)); };
  const handleUndo = () => { if (undoData) { animateLayout(); addExpense(undoData); hideUndo(); } };

  const handleSaveBudget = () => {
    updateBudgetConfig(tempBudget, tempPeriod);
    setShowBudgetModal(false);
  };

  const { spentThisPeriod, availableBalance } = getBalanceData();

  const PremiumMenuOption = ({ label, icon, color, onPress }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.premiumMenuRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.menuIconBg, { backgroundColor: color + '15' }]}>
          <IconButton icon={icon} size={20} iconColor={color} style={{ margin: 0 }} />
        </View>
        <Text style={[styles.premiumMenuText, { color: colors.text }]}>{label}</Text>
      </View>
      <IconButton icon="chevron-right" size={16} iconColor={colors.textSec} style={{ margin: 0, opacity: 0.5 }} />
    </TouchableOpacity>
  );

  const SortOption = ({ label, type, icon }) => {
    const isSelected = sortBy === type;
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => { setSortBy(type); setShowSortModal(false); }} style={[styles.sortRow, isSelected && { backgroundColor: colors.primary + '15', borderRadius: 8 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon={icon} size={20} iconColor={isSelected ? colors.primary : colors.textSec} style={{ margin: 0, marginRight: 8 }} />
          <Text style={[styles.sortText, { color: isSelected ? colors.primary : colors.text }]}>{label}</Text>
        </View>
        {isSelected && <IconButton icon="check" size={18} iconColor={colors.primary} style={{ margin: 0 }} />}
      </TouchableOpacity>
    );
  };

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

          <TouchableOpacity onPress={() => navigation.navigate('Stats')} style={[styles.chartButton, { backgroundColor: colors.surface }]}>
            <IconButton icon="chart-pie" iconColor={colors.text} size={24} style={{ margin: 0 }} />
          </TouchableOpacity>

          <View ref={headerBtnRef} collapsable={false}>
            <TouchableOpacity onPress={handleHeaderMenuPress} style={[styles.chartButton, { backgroundColor: colors.surface }]}>
              <IconButton icon="dots-vertical" iconColor={colors.text} size={24} style={{ margin: 0 }} />
            </TouchableOpacity>
          </View>

        </View>
      </View>

      {/* SMART BALANCE CARD */}
      <TouchableOpacity activeOpacity={0.8} onPress={() => { setTempBudget(budget); setTempPeriod(budgetPeriod); setShowBudgetModal(true); }}>
        <Surface style={[styles.balanceCard, { backgroundColor: colors.surface }]}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={[styles.balanceLabel, { color: colors.textSec, marginBottom: 0 }]}>Spent ({budgetPeriod})</Text>
              <IconButton icon="pencil" size={12} iconColor={colors.textSec} style={{ margin: 0, marginLeft: 2 }} />
            </View>
            <Text style={[styles.balanceAmount, { color: colors.error }]}>-{currency}{spentThisPeriod.toLocaleString('en-IN')}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.balanceLabel, { color: colors.textSec }]}>Available Limit</Text>
            <Text style={[styles.balanceAmount, { color: availableBalance < 0 ? colors.error : colors.success }]}>
              {currency}{availableBalance.toLocaleString('en-IN')}
            </Text>
          </View>
        </Surface>
      </TouchableOpacity>

      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <IconButton icon="magnify" size={20} iconColor={colors.textSec} style={{ margin: 0 }} />
        <TextInput placeholder="Search name or amount..." placeholderTextColor={colors.textSec} value={searchQuery} onChangeText={setSearchQuery} style={[styles.searchInput, { color: colors.text }]} />
        {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><IconButton icon="close-circle" size={16} iconColor={colors.textSec} style={{ margin: 0 }} /></TouchableOpacity>}
      </View>

      {/* THE CUSTOM SHORT COMPONENT */}
      <Short filter={FILTERS[activeFilterIndex]} setFilter={handleFilterPress} activeSort={sortBy} onSortPress={handleSortButtonPress} sortBtnRef={sortBtnRef} />


      <FlatList ref={flatListRef} data={FILTERS} keyExtractor={(item) => item} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={{ itemVisiblePercentThreshold: 50 }} renderItem={({ item }) => (
        <ExpensePage filter={item} searchQuery={searchQuery} sortBy={sortBy} navigation={navigation} onConfirmDelete={confirmDelete} parentExpandedId={expandedId} setParentExpandedId={(id) => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpandedId(id); }} />
      )}
      />

      <FAB icon="robot-outline" color="#fff" style={[styles.fabLeft, { backgroundColor: colors.accent || '#6200EE' }]} onPress={() => navigation.navigate('Chat')} />
      <FAB icon="plus" color="#fff" style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('AddExpense')} />

      {/* 🛠️ MODALS & MENUS */}
      
      {/* HEADER MENU POPUP */}
      <PopupMenu visible={headerMenuVisible} onClose={() => setHeaderMenuVisible(false)} triggerRef={headerBtnRef} colors={colors}>
        <PremiumMenuOption label="Notifications" icon="bell-outline" color={colors.primary} onPress={() => { setHeaderMenuVisible(false); navigation.navigate('Notifications'); }} />
        <PremiumMenuOption label="Filter Options" icon="filter-variant" color={colors.primary} onPress={() => { setHeaderMenuVisible(false); navigation.navigate('Filter'); }} />
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8, opacity: 0.5 }} />
        <PremiumMenuOption label="Settings" icon="cog-outline" color={colors.textSec} onPress={() => { setHeaderMenuVisible(false); navigation.navigate('Settings'); }} />
      </PopupMenu>

      {/* ✨ THE SORT MENU POPUP */}
      <PopupMenu visible={showSortModal} onClose={() => setShowSortModal(false)} triggerRef={sortBtnRef} colors={colors}>
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textSec, marginLeft: 12, marginBottom: 5, textTransform: 'uppercase' }}>Sort By</Text>
        <SortOption label="Recent First" type="RECENT" icon="sort-calendar-descending" />
        <SortOption label="Oldest First" type="OLD" icon="calendar-arrow-right" />
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 5, opacity: 0.5 }} />
        <SortOption label="Highest Amount" type="HIGH" icon="sort-numeric-descending" />
        <SortOption label="Lowest Amount" type="LOW" icon="sort-numeric-ascending" />
      </PopupMenu>


      <BottomSheet visible={showBudgetModal} onClose={() => setShowBudgetModal(false)} title="Wallet Config" colors={colors}>
        <Text style={{ color: colors.textSec, marginBottom: 15, textAlign: 'center' }}>Set a base budget. Any Income added will increase this available limit.</Text>
        <SegmentedButtons value={tempPeriod} onValueChange={setTempPeriod} buttons={[{ value: 'Weekly', label: 'Weekly' }, { value: 'Monthly', label: 'Monthly' }, { value: 'Yearly', label: 'Yearly' }]} theme={{ colors: { secondaryContainer: colors.primary + '20', onSecondaryContainer: colors.primary, outline: colors.border } }} style={{ marginBottom: 20 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 15, marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>{currency}</Text>
          <TextInput value={tempBudget} onChangeText={setTempBudget} keyboardType="numeric" style={{ flex: 1, fontSize: 24, fontWeight: 'bold', color: colors.text, paddingVertical: 15, marginLeft: 10 }} placeholder="0" placeholderTextColor={colors.textSec} />
        </View>
        <Button mode="contained" onPress={handleSaveBudget} buttonColor={colors.primary} textColor="#FFF" contentStyle={{ height: 50 }}>Save Config</Button>
      </BottomSheet>

      <AlertModal visible={deleteVisible} onClose={() => setDeleteVisible(false)} colors={colors}>
        <View style={[styles.alertIconCircle, { backgroundColor: '#FEE2E2' }]}>
          <IconButton icon="trash-can" size={32} iconColor={colors.error} style={{ margin: 0 }} />
        </View>
        <Text style={[styles.alertTitle, { color: colors.text }]}>Delete Transaction?</Text>
        <Text style={[styles.alertDesc, { color: colors.textSec }]}>Remove <Text style={{ fontWeight: 'bold' }}>{itemToDelete?.name}</Text> permanently?</Text>
        <View style={styles.alertBtnRow}>
          <Button mode="text" onPress={() => setDeleteVisible(false)} textColor={colors.textSec} style={{ flex: 1 }}>Cancel</Button>
          <Button mode="contained" onPress={performDelete} buttonColor={colors.error} style={{ flex: 1, borderRadius: 12 }}>Delete</Button>
        </View>
      </AlertModal>

      <OnboardingTutorial visible={isFirstLaunch} onComplete={completeTutorial} colors={colors} />

      <Animated.View style={[styles.undoContainer, { transform: [{ translateY: undoAnim }] }]}><Surface style={[styles.undoBar, { backgroundColor: '#333' }]} elevation={4}><View style={{ flexDirection: 'row', alignItems: 'center' }}><IconButton icon="trash-can-outline" size={20} iconColor="#FFF" /><Text style={{ color: '#FFF', fontWeight: 'bold' }}>Deleted.</Text></View><TouchableOpacity onPress={handleUndo} style={{ padding: 10 }}><Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>UNDO</Text></TouchableOpacity></Surface></Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  headerTitle: { fontSize: 26, fontWeight: '800', marginLeft: 15 },
  chartButton: { borderRadius: 50, padding: 6, elevation: 3 },
  balanceCard: { marginHorizontal: 24, marginBottom: 15, padding: 20, borderRadius: 16, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmount: { fontSize: 26, fontWeight: '800' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 15, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 8, marginLeft: 5 },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  card: { borderRadius: 16, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  dateTextBig: { fontSize: 14, fontWeight: 'bold' },
  dateTextNum: { fontSize: 16, fontWeight: 'bold', lineHeight: 18 },
  dateTextDay: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  itemCategory: { fontSize: 12, marginTop: 2 },
  itemAmount: { fontSize: 16, fontWeight: '700' },
  expandedContent: { paddingHorizontal: 16, paddingBottom: 20 },
  inputContainer: { borderRadius: 16, overflow: 'hidden', padding: 15, marginBottom: 12 },
  noteBox: { marginBottom: 15, padding: 12, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12 },
  rawInput: { fontSize: 16, height: 35, backgroundColor: 'transparent', paddingHorizontal: 0 },
  divider: { height: 1, opacity: 0.1, marginVertical: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },

  modalOverlay: { flex: 1 },
  alertBox: { width: '80%', alignSelf: 'center', borderRadius: 28, padding: 24, alignItems: 'center', elevation: 10 },

  bottomSheet: { width: '100%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40, elevation: 20 },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.2)', alignSelf: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },

  popupMenu: {
    position: 'absolute', width: 220, borderRadius: 20, padding: 12, elevation: 15,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15,
  },

  premiumMenuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 4 },
  menuIconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  premiumMenuText: { fontSize: 15, fontWeight: '600' },

  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 8, marginBottom: 2 },
  sortText: { fontSize: 14, fontWeight: '600' },

  alertIconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  alertTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  alertDesc: { fontSize: 14, textAlign: 'center', marginBottom: 24, opacity: 0.7 },
  alertBtnRow: { flexDirection: 'row', width: '100%', gap: 10 },

  undoContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, alignItems: 'center' },
  undoBar: { width: '100%', borderRadius: 16, padding: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },

  emptyText: { textAlign: 'center', marginTop: 50 },
  fab: { position: 'absolute', right: 20, bottom: Platform.OS === 'ios' ? 40 : 30, borderRadius: 16, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
  fabLeft: { position: 'absolute', left: 20, bottom: Platform.OS === 'ios' ? 40 : 30, borderRadius: 16, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },

  onboardingCard: { width: '85%', alignSelf: 'center', borderRadius: 28, padding: 30, alignItems: 'center', elevation: 15 },
  onboardingIconBg: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  onboardingTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  onboardingDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  dotsContainer: { flexDirection: 'row', gap: 8, marginBottom: 30 },
  dot: { height: 8, borderRadius: 4 },
  onboardingBtn: { width: '100%', borderRadius: 16, paddingVertical: 5 },
});