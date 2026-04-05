import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Text, IconButton, Surface, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';
import ExpenseCalendar from '../components/ExpenseCalendar';

const { width } = Dimensions.get('window');

// --- INDIVIDUAL TRANSACTION ROW ---
const TransactionRow = ({ item, currency, colors }) => {
  const isIncome = item.type === 'income';
  const amountColor = isIncome ? colors.success : colors.text;
  const iconColor = isIncome ? colors.success : colors.error;
  const iconName = isIncome ? 'arrow-down-thick' : 'arrow-up-thick';

  const timeString = new Date(item.date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <View style={styles.transactionRow}>
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIconBox, { backgroundColor: iconColor + '15' }]}>
          <IconButton icon={iconName} size={20} iconColor={iconColor} style={{ margin: 0 }} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.transactionCategory, { color: colors.textSec }]}>
            {item.category} • {timeString}
          </Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, { color: amountColor }]}>
          {isIncome ? '+' : '-'}{currency}{parseFloat(item.amount).toLocaleString('en-IN')}
        </Text>
        {item.paymentMode && (
          <Text style={[styles.transactionPayment, { color: colors.textSec }]}>
            {item.paymentMode}
          </Text>
        )}
      </View>
    </View>
  );
};

// --- PROGRESS BAR COMPONENT ---
const CategoryBar = ({ category, amount, total, color, icon, currency }) => {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const percentage = total > 0 ? (amount / total) * 100 : 0;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: percentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  return (
    <View style={styles.catRow}>
      <View style={[styles.catIconBox, { backgroundColor: color + '15' }]}>
        <IconButton icon={icon} size={20} iconColor={color} style={{ margin: 0 }} />
      </View>
      <View style={styles.catDetails}>
        <View style={styles.catHeader}>
          <Text style={styles.catName}>{category}</Text>
          <Text style={styles.catAmount}>{currency}{amount.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.barBackground}>
          <Animated.View
            style={[
              styles.barFill,
              {
                backgroundColor: color,
                width: fillAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] })
              }
            ]}
          />
        </View>
      </View>
    </View>
  );
};

// --- MAIN SCREEN ---
export default function StatsScreen({ navigation }) {
  // ✨ FIX 1: Brought in 'expenses: allRawData'
  const { getFilteredExpenses, expenses: allRawData, colors, currency, isDark } = useExpenses();
  const [timeFilter, setTimeFilter] = useState('Month');

  const todayDateStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayDateStr);

  // ✨ FIX 2: Define Calendar Data safely bypassing time filters
  const allExpensesForCalendar = (allRawData || []).filter(item => item.type === 'expense' || !item.type);
  const allIncomesForCalendar = (allRawData || []).filter(item => item.type === 'income');

  // --- 1. DATA PROCESSING ---
  const currentData = getFilteredExpenses(timeFilter);

  const chartExpenses = currentData.filter(item => item.type === 'expense' || !item.type);
  const chartIncomes = currentData.filter(item => item.type === 'income');

  const dailyExpenses = allExpensesForCalendar.filter(exp => {
    const d = new Date(exp.date);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dateKey === selectedDate;
  });

  const dailyIncomes = allIncomesForCalendar.filter(inc => {
    const d = new Date(inc.date);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dateKey === selectedDate;
  });

  const displayExpenses = selectedDate ? dailyExpenses : chartExpenses;
  const displayIncomes = selectedDate ? dailyIncomes : chartIncomes;

  // ✨ FIX: Two separate totals!
  // 1. Chart Total (Updates when you click a day)
  const displayTotalExpense = displayExpenses.reduce((sum, item) => sum + item.amount, 0);
  const displayTotalIncome = displayIncomes.reduce((sum, item) => sum + item.amount, 0);
  const displayNetSavings = displayTotalIncome - displayTotalExpense;
  
  // 2. Budget Total (Always compares the full time filter, including split days)
  const periodTotalExpense = chartExpenses.reduce((sum, item) => sum + item.amount, 0);
  const periodTotalIncome = chartIncomes.reduce((sum, item) => sum + item.amount, 0);
  const periodNetSavings = periodTotalIncome - periodTotalExpense;

  const categoryTotals = displayExpenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});

  const sortedCategories = Object.keys(categoryTotals)
    .map(key => ({ name: key, amount: categoryTotals[key] }))
    .sort((a, b) => b.amount - a.amount);

  const getCategoryIcon = (catName) => {
    const iconMap = { 'Food': 'silverware-fork-knife', 'Travel': 'car', 'Bills': 'file-document-outline', 'Shopping': 'shopping', 'Health': 'medical-bag', 'Other': 'dots-horizontal', 'Entertainment': 'movie-open', 'Education': 'school', 'Investment': 'chart-line' };
    return iconMap[catName] || 'cash';
  };

  const cashflowTotal = displayTotalIncome + displayTotalExpense;
  const incomePercent = cashflowTotal > 0 ? (displayTotalIncome / cashflowTotal) * 100 : 50;
  const expensePercent = cashflowTotal > 0 ? (displayTotalExpense / cashflowTotal) * 100 : 50;

  // ✨ FIX 3: Safe Date Formatter
  const getFormattedDate = (dateString) => {
    if (!dateString) return '';
    const [y, m, d] = dateString.split('-');
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <IconButton icon="arrow-left" size={24} iconColor={colors.text} style={{ margin: 0 }} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterRow}>
        {['Week', 'Month', 'Year'].map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => {
              setTimeFilter(f);
              setSelectedDate(null); // Deselect date to see macro stats
            }}
            style={[
              styles.filterPill, 
              timeFilter === f && !selectedDate ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
            ]}
          >
            <Text style={{ color: timeFilter === f && !selectedDate ? '#FFF' : colors.textSec, fontWeight: timeFilter === f && !selectedDate ? 'bold' : '500' }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* ✨ 2. The Calendar now naturally takes up 100% of the width! */}
        <ExpenseCalendar
          expenses={allExpensesForCalendar} 
          selectedDate={selectedDate} 
          onSelectDate={setSelectedDate} 
          colors={colors}
        />

        {/* ✨ 3. Wrap everything else in a Padded Container so your charts stay perfectly centered! */}
        <View style={{ paddingHorizontal: 20 }}>
          
          {selectedDate && (
            <View style={{ paddingBottom: 40 }}>
              <Text style={[styles.listHeader, { color: colors.text }]}>
                Transactions for {getFormattedDate(selectedDate)}
              </Text>

              {(() => {
                const dayTransactions = [...dailyExpenses, ...dailyIncomes];
                dayTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

                if (dayTransactions.length === 0) {
                  return (
                    <View style={styles.emptyDayContainer}>
                      <IconButton icon="coffee-outline" size={48} iconColor={colors.textSec} style={{ opacity: 0.5 }} />
                      <Text style={[styles.emptyDayText, { color: colors.text }]}>No transactions</Text>
                      <Text style={[styles.emptyDaySub, { color: colors.textSec }]}>You didn't spend or earn anything on this day.</Text>
                    </View>
                  );
                }

                return dayTransactions.map((item) => (
                  <TransactionRow
                    key={item.id}
                    item={item}
                    currency={currency}
                    colors={colors}
                  />
                ));
              })()}
            </View>
          )}

          <View style={styles.dateHeader}>
            <Text style={[styles.dateTitle, { color: colors.text }]}>
              {selectedDate ? (selectedDate === todayDateStr ? 'Today' : selectedDate) : `${timeFilter}ly Analytics`}
            </Text>
            <Text style={[styles.dateSubtitle, { color: colors.textSec }]}>
              Cashflow Overview
            </Text>
          </View>

          <Surface style={[styles.cashflowCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardLabel, { color: colors.textSec }]}>Cashflow ({selectedDate ? 'Daily' : timeFilter})</Text>

            <View style={styles.netSavingsRow}>
              <Text style={[styles.netSavingsAmount, { color: displayNetSavings >= 0 ? colors.success : colors.error }]}>
                {displayNetSavings >= 0 ? '+' : ''}{currency}{displayNetSavings.toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.netSavingsLabel, { color: colors.textSec }]}>Net Saved</Text>
            </View>

            <View style={styles.cashflowBarContainer}>
              <View style={[styles.cashflowIncomeSegment, { width: `${incomePercent}%`, backgroundColor: colors.success }]} />
              <View style={[styles.cashflowExpenseSegment, { width: `${expensePercent}%`, backgroundColor: colors.error }]} />
            </View>

            <View style={styles.cashflowDetails}>
              <View>
                <Text style={{ color: colors.textSec, fontSize: 12, marginBottom: 2 }}>Income</Text>
                <Text style={{ color: colors.success, fontWeight: 'bold', fontSize: 16 }}>+{currency}{displayTotalIncome.toLocaleString('en-IN')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.textSec, fontSize: 12, marginBottom: 2 }}>Expenses</Text>
                <Text style={{ color: colors.error, fontWeight: 'bold', fontSize: 16 }}>-{currency}{displayTotalExpense.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </Surface>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Expenses</Text>
            <Text style={{ color: colors.textSec }}>{sortedCategories.length} Categories</Text>
          </View>

          <Surface style={[styles.breakdownCard, { backgroundColor: colors.surface }]}>
            {sortedCategories.length === 0 ? (
              <View style={styles.emptyState}>
                <Avatar.Icon size={60} icon="chart-donut-variant" style={{ backgroundColor: colors.chip }} color={colors.textSec} />
                <Text style={{ color: colors.textSec, marginTop: 10 }}>No expenses found.</Text>
              </View>
            ) : (
              sortedCategories.map((cat, index) => (
                <CategoryBar
                  key={index}
                  category={cat.name}
                  amount={cat.amount}
                  total={displayTotalExpense}
                  color={colors.primary}
                  icon={getCategoryIcon(cat.name)}
                  currency={currency}
                />
              ))
            )}
          </Surface>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10 },
  iconBtn: { padding: 5, borderRadius: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  filterRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10, gap: 10 },
  filterPill: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  cashflowCard: { borderRadius: 24, padding: 20, elevation: 2, marginTop: 10, marginBottom: 30 },
  cardLabel: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 15 },
  netSavingsRow: { alignItems: 'center', marginBottom: 25 },
  netSavingsAmount: { fontSize: 36, fontWeight: '900' },
  netSavingsLabel: { fontSize: 14, marginTop: 4 },
  cashflowBarContainer: { height: 12, borderRadius: 6, flexDirection: 'row', overflow: 'hidden', marginBottom: 15, backgroundColor: '#f0f0f0' },
  cashflowIncomeSegment: { height: '100%', borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
  cashflowExpenseSegment: { height: '100%', borderTopRightRadius: 6, borderBottomRightRadius: 6 },
  cashflowDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15, paddingHorizontal: 5 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  breakdownCard: { borderRadius: 24, padding: 20, elevation: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  catIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  catDetails: { flex: 1 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  catName: { fontSize: 15, fontWeight: '600' },
  catAmount: { fontSize: 15, fontWeight: '700' },
  barBackground: { height: 6, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  dateHeader: { marginTop: 16, marginBottom: 12 },
  dateTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  dateSubtitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  listHeader: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  transactionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#88888815' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  transactionIconBox: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  transactionInfo: { flex: 1, paddingRight: 10 },
  transactionName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  transactionCategory: { fontSize: 12 },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  transactionPayment: { fontSize: 11, fontWeight: '500' },
  emptyDayContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyDayText: { fontSize: 16, fontWeight: '600', marginTop: 10 },
  emptyDaySub: { fontSize: 13, marginTop: 4 },
});