import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Text, IconButton, Surface, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';

const { width } = Dimensions.get('window');

// --- PROGRESS BAR COMPONENT ---
const CategoryBar = ({ category, amount, total, color, icon, currency }) => {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const percentage = total > 0 ? (amount / total) * 100 : 0;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: percentage,
      duration: 800,
      useNativeDriver: false, // width/flex cannot use native driver
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

export default function StatsScreen({ navigation }) {
  const { getFilteredExpenses, colors, currency, isDark } = useExpenses();
  const [timeFilter, setTimeFilter] = useState('Month');

  // --- 1. DATA PROCESSING ---
  const currentData = getFilteredExpenses(timeFilter);

  // Separate Income and Expenses
  const expenses = currentData.filter(item => item.type === 'expense' || !item.type);
  const incomes = currentData.filter(item => item.type === 'income');

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const netSavings = totalIncome - totalExpense;

  // Group Expenses by Category
  const categoryTotals = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});

  // Sort Categories highest to lowest
  const sortedCategories = Object.keys(categoryTotals)
    .map(key => ({ name: key, amount: categoryTotals[key] }))
    .sort((a, b) => b.amount - a.amount);

  // Helper for Icons
  const getCategoryIcon = (catName) => {
    const iconMap = { 'Food': 'silverware-fork-knife', 'Travel': 'car', 'Bills': 'file-document-outline', 'Shopping': 'shopping', 'Health': 'medical-bag', 'Other': 'dots-horizontal', 'Entertainment': 'movie-open', 'Education': 'school', 'Investment': 'chart-line' };
    return iconMap[catName] || 'cash';
  };

  // Cashflow Bar Math
  const cashflowTotal = totalIncome + totalExpense;
  const incomePercent = cashflowTotal > 0 ? (totalIncome / cashflowTotal) * 100 : 50;
  const expensePercent = cashflowTotal > 0 ? (totalExpense / cashflowTotal) * 100 : 50;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <IconButton icon="arrow-left" size={24} iconColor={colors.text} style={{margin: 0}} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
        <View style={{width: 40}} /> 
      </View>

      {/* TIME FILTERS */}
      <View style={styles.filterRow}>
        {['Week', 'Month', 'Year'].map(f => (
            <TouchableOpacity 
                key={f} 
                onPress={() => setTimeFilter(f)}
                style={[styles.filterPill, timeFilter === f ? {backgroundColor: colors.primary} : {backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border}]}
            >
                <Text style={{color: timeFilter === f ? '#FFF' : colors.textSec, fontWeight: timeFilter === f ? 'bold' : '500'}}>{f}</Text>
            </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* CASHFLOW SUMMARY CARD */}
        <Surface style={[styles.cashflowCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardLabel, { color: colors.textSec }]}>Cashflow ({timeFilter})</Text>
            
            <View style={styles.netSavingsRow}>
                <Text style={[styles.netSavingsAmount, { color: netSavings >= 0 ? colors.success : colors.error }]}>
                    {netSavings >= 0 ? '+' : ''}{currency}{netSavings.toLocaleString('en-IN')}
                </Text>
                <Text style={[styles.netSavingsLabel, { color: colors.textSec }]}>Net Saved</Text>
            </View>

            {/* Visual Cashflow Bar */}
            <View style={styles.cashflowBarContainer}>
                <View style={[styles.cashflowIncomeSegment, { width: `${incomePercent}%`, backgroundColor: colors.success }]} />
                <View style={[styles.cashflowExpenseSegment, { width: `${expensePercent}%`, backgroundColor: colors.error }]} />
            </View>

            <View style={styles.cashflowDetails}>
                <View>
                    <Text style={{color: colors.textSec, fontSize: 12, marginBottom: 2}}>Income</Text>
                    <Text style={{color: colors.success, fontWeight: 'bold', fontSize: 16}}>+{currency}{totalIncome.toLocaleString('en-IN')}</Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                    <Text style={{color: colors.textSec, fontSize: 12, marginBottom: 2}}>Expenses</Text>
                    <Text style={{color: colors.error, fontWeight: 'bold', fontSize: 16}}>-{currency}{totalExpense.toLocaleString('en-IN')}</Text>
                </View>
            </View>
        </Surface>

        {/* TOP EXPENSES SECTION */}
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Expenses</Text>
            <Text style={{color: colors.textSec}}>{sortedCategories.length} Categories</Text>
        </View>

        <Surface style={[styles.breakdownCard, { backgroundColor: colors.surface }]}>
            {sortedCategories.length === 0 ? (
                <View style={styles.emptyState}>
                    <Avatar.Icon size={60} icon="chart-donut-variant" style={{backgroundColor: colors.chip}} color={colors.textSec} />
                    <Text style={{color: colors.textSec, marginTop: 10}}>No expenses this {timeFilter.toLowerCase()}.</Text>
                </View>
            ) : (
                sortedCategories.map((cat, index) => (
                    <CategoryBar 
                        key={index}
                        category={cat.name}
                        amount={cat.amount}
                        total={totalExpense}
                        color={colors.primary}
                        icon={getCategoryIcon(cat.name)}
                        currency={currency}
                    />
                ))
            )}
        </Surface>

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

  // Cashflow Card
  cashflowCard: { borderRadius: 24, padding: 20, elevation: 2, marginTop: 10, marginBottom: 30 },
  cardLabel: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 15 },
  netSavingsRow: { alignItems: 'center', marginBottom: 25 },
  netSavingsAmount: { fontSize: 36, fontWeight: '900' },
  netSavingsLabel: { fontSize: 14, marginTop: 4 },
  
  cashflowBarContainer: { height: 12, borderRadius: 6, flexDirection: 'row', overflow: 'hidden', marginBottom: 15, backgroundColor: '#f0f0f0' },
  cashflowIncomeSegment: { height: '100%', borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
  cashflowExpenseSegment: { height: '100%', borderTopRightRadius: 6, borderBottomRightRadius: 6 },
  
  cashflowDetails: { flexDirection: 'row', justifyContent: 'space-between' },

  // Breakdown Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15, paddingHorizontal: 5 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  breakdownCard: { borderRadius: 24, padding: 20, elevation: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },

  // Category Bar
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  catIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  catDetails: { flex: 1 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  catName: { fontSize: 15, fontWeight: '600' },
  catAmount: { fontSize: 15, fontWeight: '700' },
  barBackground: { height: 6, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
});