import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { PieChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from './ExpenseContext';

export default function StatsScreen({ navigation }) {
  const { expenses } = useExpenses();

  // 1. Calculate Totals by Category
  const categoryTotals = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});

  // 2. Assign Aesthetic Colors
  const COLORS = {
    Food: '#FF6B6B',      // Red/Pink
    Travel: '#4ECDC4',    // Teal
    Bills: '#FFE66D',     // Yellow
    Shopping: '#1A535C',  // Dark Teal
    Health: '#FF9F1C',    // Orange
    Other: '#2B2D42',     // Dark Blue
  };

  // 3. Prepare Data for Chart
  const chartData = Object.keys(categoryTotals).map((cat) => ({
    value: categoryTotals[cat],
    color: COLORS[cat] || '#ccc',
    text: cat,
  }));

  // Calculate Grand Total for the center label
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Chart Section */}
        <View style={styles.chartContainer}>
          {total > 0 ? (
            <PieChart
              data={chartData}
              donut
              radius={120}
              innerRadius={80}
              showText={false} // Clean look (no text on slices)
              focusOnPress
              sectionAutoFocus
              centerLabelComponent={() => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.centerLabel}>Total</Text>
                  <Text style={styles.centerAmount}>₹{total}</Text>
                </View>
              )}
            />
          ) : (
            <Text style={styles.noDataText}>Add expenses to see stats 📊</Text>
          )}
        </View>

        {/* Legend / Breakdown List */}
        <View style={styles.legendContainer}>
          {chartData.map((item) => (
            <Surface key={item.text} style={styles.legendCard} elevation={1}>
              <View style={styles.legendLeft}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <Text style={styles.categoryName}>{item.text}</Text>
              </View>
              <Text style={styles.categoryAmount}>₹{item.value}</Text>
            </Surface>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollContent: { paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, marginBottom: 20 },
  backBtn: { padding: 10 },
  backText: { fontSize: 24, color: '#333' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },

  // Chart Area
  chartContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
  centerLabel: { fontSize: 14, color: '#888' },
  centerAmount: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  noDataText: { fontSize: 16, color: '#999', marginTop: 50 },

  // Breakdown List
  legendContainer: { paddingHorizontal: 24 },
  legendCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 10 
  },
  legendLeft: { flexDirection: 'row', alignItems: 'center' },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  categoryName: { fontSize: 16, fontWeight: '600', color: '#333' },
  categoryAmount: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
});