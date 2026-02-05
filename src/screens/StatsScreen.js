import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { PieChart } from 'react-native-gifted-charts'; // <--- The Better Library
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext'; // <--- Fixed Import Path

const screenWidth = Dimensions.get("window").width;

// 🎨 Aesthetic Palette
const PALETTE = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#96CEB4', '#D4A5A5'];

export default function StatsScreen({ navigation }) {
  const { expenses } = useExpenses();

  // State for the "Center Label" (What appears in the middle)
  const [selectedSlice, setSelectedSlice] = useState(null);

  // 1. Calculate Totals
  const categoryTotals = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

  // 2. Format Data for Gifted Charts
  // We add 'focused: true' to the selected slice so it pops out!
  const chartData = Object.keys(categoryTotals).map((cat, index) => {
    const amount = categoryTotals[cat];
    const isSelected = selectedSlice && selectedSlice.name === cat;
    
    return {
      value: amount,
      text: cat, // Used for logic, not display
      color: PALETTE[index % PALETTE.length],
      focused: isSelected, // <--- The "Pop Out" effect
      onPress: () => setSelectedSlice({ name: cat, amount: amount }) // <--- Click Logic
    };
  });

  // Sort biggest first
  chartData.sort((a, b) => b.value - a.value);

  // 3. The Component for the Middle of the Donut
  const CenterLabel = () => {
    if (!selectedSlice) {
      // Default View (Total)
      return (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#888', fontSize: 12 }}>Total</Text>
          <Text style={{ color: '#1A1A1A', fontSize: 24, fontWeight: 'bold' }}>
             ₹{totalExpense.toLocaleString()}
          </Text>
        </View>
      );
    }
    // Selected View (Specific Category)
    return (
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: '#666', fontSize: 14, fontWeight: '600' }}>{selectedSlice.name}</Text>
        <Text style={{ color: '#1A1A1A', fontSize: 22, fontWeight: 'bold' }}>
           ₹{selectedSlice.amount.toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Spending Breakdown</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* --- INTERACTIVE CHART --- */}
        {chartData.length > 0 ? (
          <Surface style={styles.chartCard} elevation={2}>
            <Text style={styles.chartTitle}>Category Analysis</Text>
            <Text style={styles.hintText}>(Tap a slice to see details)</Text>
            
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <PieChart
                data={chartData}
                donut
                radius={130}
                innerRadius={90} // Makes the donut ring
                centerLabelComponent={CenterLabel} // Shows text in middle
                focusOnPress // Enables the click animation
                sectionAutoFocus // Auto highlights
                strokeColor="white"
                strokeWidth={2}
              />
            </View>

            {/* Custom Legend List */}
            <View style={styles.legendContainer}>
              {chartData.map((item, index) => {
                const percent = ((item.value / totalExpense) * 100).toFixed(1);
                const isSelected = selectedSlice?.name === item.text;
                
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.legendRow, isSelected && styles.activeLegendRow]} // Highlight row if clicked
                    onPress={() => setSelectedSlice({ name: item.text, amount: item.value })}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                        <Text style={[styles.legendText, isSelected && { color: '#2575fc' }]}>{item.text}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.legendAmount}>₹{item.value}</Text>
                        <Text style={styles.legendPercent}>{percent}%</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Surface>
        ) : (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No data to show yet 📊</Text>
                <Text style={styles.emptySub}>Add some expenses to see charts!</Text>
            </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  chartCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center' },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  hintText: { fontSize: 12, color: '#aaa', marginBottom: 15 },
  
  legendContainer: { width: '100%', marginTop: 25 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  activeLegendRow: { backgroundColor: '#F0F8FF' }, // Light Blue highlight

  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  legendText: { fontSize: 15, fontWeight: '600', color: '#333' },
  legendAmount: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A' },
  legendPercent: { fontSize: 12, color: '#999' },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, color: '#666', fontWeight: 'bold' },
  emptySub: { fontSize: 14, color: '#aaa', marginTop: 5 }
});