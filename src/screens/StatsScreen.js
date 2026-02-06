import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Surface, IconButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, ProgressChart } from 'react-native-chart-kit';
import { useExpenses } from '../context/ExpenseContext';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen({ navigation }) {
  const { expenses, budget, getTotalSpent, currency, categories } = useExpenses();
  const [selectedCategory, setSelectedCategory] = useState(null);

  // --- 1. BUDGET DATA (The Design You Liked) ---
  const totalSpent = getTotalSpent();
  const totalBudget = parseFloat(budget) || 1; 
  const percentageUsed = totalSpent / totalBudget;
  const chartPercent = percentageUsed > 1 ? 1 : percentageUsed;
  
  const budgetData = { data: [chartPercent] };

  // Ring Colors (Green -> Yellow -> Red)
  let ringColor = (opacity = 1) => `rgba(76, 175, 80, ${opacity})`; // Green
  if (percentageUsed > 0.5) ringColor = (opacity = 1) => `rgba(255, 193, 7, ${opacity})`; // Yellow
  if (percentageUsed > 0.9) ringColor = (opacity = 1) => `rgba(244, 67, 54, ${opacity})`; // Red

  // --- 2. PIE CHART DATA ---
  const palette = ['#6C63FF', '#FF6584', '#FFC75F', '#4BC0C0', '#845EC2', '#FF9671', '#008F7A'];
  
  const pieData = categories.map((cat, index) => {
    const totalForCat = expenses
      .filter(e => e.category === cat)
      .reduce((sum, item) => sum + item.amount, 0);

    // HIGHLIGHT LOGIC:
    // If you click a category, others turn Gray
    const isSelected = selectedCategory === cat;
    const isAnySelected = selectedCategory !== null;
    
    let sliceColor = palette[index % palette.length];
    if (isAnySelected && !isSelected) {
        sliceColor = '#E0E0E0'; // Fade out others
    }

    return {
      name: cat,
      amount: totalForCat,
      color: sliceColor,
      legendFontColor: "#7F7F7F",
      legendFontSize: 12
    };
  }).filter(item => item.amount > 0); 

  pieData.sort((a, b) => b.amount - a.amount);

  // --- CLICK HANDLER ---
  const handlePress = (name) => {
    setSelectedCategory(selectedCategory === name ? null : name);
  };

  // Center Label Data
  const activeItem = pieData.find(i => i.name === selectedCategory);
  const centerLabel = activeItem ? activeItem.name : "Total";
  const centerAmount = activeItem ? activeItem.amount : totalSpent;
  const centerColor = activeItem ? activeItem.color : '#1A1A1A';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <IconButton icon="arrow-left" size={28} iconColor="#1A1A1A" style={{marginLeft: -10}} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Financial Insights</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- 1. BUDGET CARD (RESTORED THE ONE YOU LIKED) --- */}
        <Surface style={styles.budgetCard} elevation={3}>
            <View style={styles.ringRow}>
                {/* Chart on Left */}
                <ProgressChart
                    data={budgetData}
                    width={100}
                    height={100}
                    strokeWidth={10}
                    radius={40}
                    chartConfig={{
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        color: ringColor,
                        strokeWidth: 2,
                    }}
                    hideLegend={true}
                />
                
                {/* Details on Right */}
                <View style={styles.budgetInfo}>
                    <Text style={styles.budgetLabel}>Monthly Budget</Text>
                    <Text style={styles.budgetValue}>{(percentageUsed * 100).toFixed(0)}% Used</Text>
                    
                    {/* Tiny Progress Bar */}
                    <View style={styles.barContainer}>
                         <View style={[styles.barFill, { width: `${chartPercent * 100}%`, backgroundColor: ringColor(1) }]} />
                    </View>
                    
                    <Text style={styles.budgetMath}>
                        {currency}{totalSpent.toLocaleString()} / {currency}{totalBudget.toLocaleString()}
                    </Text>
                </View>
            </View>
        </Surface>

        {/* --- 2. SPENDING BREAKDOWN --- */}
        <Text style={styles.sectionTitle}>Spending Breakdown</Text>
        
        <Surface style={styles.chartCard} elevation={2}>
            {pieData.length > 0 ? (
                <>
                    {/* CHART AREA */}
                    <View style={styles.chartWrapper}>
                        <PieChart
                            data={pieData}
                            width={screenWidth}
                            height={240}
                            chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
                            accessor={"amount"}
                            backgroundColor={"transparent"}
                            paddingLeft={screenWidth / 4} // Centers the chart
                            center={[0, 0]}
                            hasLegend={false}
                            absolute
                        />
                        {/* HOLE / CENTER TEXT */}
                        <View style={styles.donutHole}>
                            <Text style={[styles.donutLabel, {color: centerColor}]}>{centerLabel}</Text>
                            <Text style={styles.donutAmount}>{currency}{centerAmount.toLocaleString()}</Text>
                        </View>
                    </View>

                    <Divider style={{ marginVertical: 15 }} />
                    <Text style={styles.hintText}>Tap a category below to highlight 👆</Text>

                    {/* INTERACTIVE LIST */}
                    <View style={styles.listContainer}>
                        {pieData.map((item) => {
                            const isSelected = selectedCategory === item.name;
                            return (
                                <TouchableOpacity 
                                    key={item.name} 
                                    onPress={() => handlePress(item.name)}
                                    style={[styles.listItem, isSelected && styles.selectedItem]}
                                >
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <View style={[styles.dot, { backgroundColor: item.color }]} />
                                        <Text style={[styles.listName, isSelected && { fontWeight: 'bold' }]}>{item.name}</Text>
                                    </View>
                                    <View style={{alignItems: 'flex-end'}}>
                                        <Text style={[styles.listAmount, isSelected && { color: item.color }]}>
                                            -{currency}{item.amount.toLocaleString()}
                                        </Text>
                                        <Text style={styles.listPercent}>
                                            {((item.amount / totalSpent) * 100).toFixed(0)}%
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </>
            ) : (
                <View style={styles.emptyState}>
                    <IconButton icon="chart-donut" size={40} iconColor="#ddd" />
                    <Text style={{color:'#aaa'}}>No expenses yet this month.</Text>
                </View>
            )}
        </Surface>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FD' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginLeft: 0 },

  // BUDGET CARD (Restored Style)
  budgetCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  ringRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  budgetInfo: { marginLeft: 20, flex: 1 },
  budgetLabel: { fontSize: 12, color: '#999', textTransform: 'uppercase', fontWeight: '600' },
  budgetValue: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginBottom: 5 },
  budgetMath: { fontSize: 14, color: '#555', marginTop: 5, fontWeight: '500' },
  barContainer: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, width: '100%', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 15 },
  
  // CHART CARD
  chartCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 2 },
  chartWrapper: { alignItems: 'center', justifyContent: 'center', height: 240 },
  donutHole: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 10, pointerEvents: 'none' }, // pointerEvents none lets clicks pass through if needed
  donutLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2, textTransform: 'uppercase' },
  donutAmount: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },

  hintText: { textAlign: 'center', color: '#ccc', fontSize: 12, marginBottom: 10, fontStyle: 'italic' },

  // LIST STYLES
  listContainer: { paddingHorizontal: 10 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F9F9F9' },
  selectedItem: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 10, marginHorizontal: -10, borderColor: 'transparent' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  listName: { fontSize: 15, color: '#333', fontWeight: '500' },
  listAmount: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  listPercent: { fontSize: 12, color: '#999', marginTop: 2 },

  emptyState: { alignItems: 'center', padding: 40 },
});