import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button, Surface, Portal, Modal } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Other'];

export default function Compare({ expenses }) {
  const [compareMode, setCompareMode] = useState('Day'); 

  // Dates
  const [date1, setDate1] = useState(new Date()); 
  const [date2, setDate2] = useState(new Date(new Date().setDate(new Date().getDate() - 1))); 
  
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); 

  const [showInsight, setShowInsight] = useState(false);
  const [insightData, setInsightData] = useState([]);

  // Reset logic
  useEffect(() => {
    const now = new Date();
    if (compareMode === 'Day') {
        setDate1(new Date()); 
        setDate2(new Date(new Date().setDate(now.getDate() - 1))); 
    } else if (compareMode === 'Week') {
        setDate1(new Date()); 
        setDate2(new Date(new Date().setDate(now.getDate() - 7))); 
    } else if (compareMode === 'Month') {
        setDate1(new Date()); 
        setDate2(new Date(new Date().setMonth(now.getMonth() - 1))); 
    }
  }, [compareMode]);

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      if (pickerTarget === 'date1') setDate1(selectedDate);
      if (pickerTarget === 'date2') setDate2(selectedDate);
    }
  };

  const openDatePicker = (target) => {
    setPickerTarget(target);
    setShowPicker(true);
  };

  // --- Logic Helpers ---
  const getDateRangeForTarget = (targetDate) => {
    const start = new Date(targetDate);
    const end = new Date(targetDate);

    if (compareMode === 'Day') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    } else if (compareMode === 'Week') {
        const day = start.getDay(); 
        const diff = start.getDate() - day; 
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
    } else if (compareMode === 'Month') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
    }
    return { startDate: start, endDate: end };
  };

  const getSmartLabel = (d) => {
    const now = new Date();
    const { startDate, endDate } = getDateRangeForTarget(d);
    
    if (compareMode === 'Day') {
        const today = new Date(); today.setHours(0,0,0,0);
        const target = new Date(d); target.setHours(0,0,0,0);
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

        if (target.getTime() === today.getTime()) return "Today";
        if (target.getTime() === yesterday.getTime()) return "Yesterday";
        return d.toDateString();
    }
    if (compareMode === 'Week') {
        return `${startDate.getDate()} ${startDate.toLocaleString('default', { month: 'short' })} - ${endDate.getDate()} ${endDate.toLocaleString('default', { month: 'short' })}`;
    }
    if (compareMode === 'Month') {
        return d.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
  };

  const getPeriodTotal = (targetDate) => {
    const { startDate, endDate } = getDateRangeForTarget(targetDate);
    return expenses
      .filter(item => {
        const d = new Date(item.date);
        return d >= startDate && d <= endDate;
      })
      .reduce((sum, item) => sum + item.amount, 0);
  };

  const generateInsight = () => {
    const { startDate: startCurr, endDate: endCurr } = getDateRangeForTarget(date1);
    const { startDate: startPrev, endDate: endPrev } = getDateRangeForTarget(date2);

    const currentGroups = {};
    expenses.forEach(item => {
      const d = new Date(item.date);
      if (d >= startCurr && d <= endCurr) currentGroups[item.category] = (currentGroups[item.category] || 0) + item.amount;
    });

    const prevGroups = {};
    expenses.forEach(item => {
      const d = new Date(item.date);
      if (d >= startPrev && d <= endPrev) prevGroups[item.category] = (prevGroups[item.category] || 0) + item.amount;
    });

    const report = CATEGORIES.map(cat => {
      const curr = currentGroups[cat] || 0;
      const prev = prevGroups[cat] || 0;
      return { category: cat, curr, prev, diff: curr - prev };
    });

    setInsightData(report.filter(r => r.curr > 0 || r.prev > 0).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)));
    setShowInsight(true);
  };

  const currentTotal = getPeriodTotal(date1); 
  const previousTotal = getPeriodTotal(date2); 
  const difference = currentTotal - previousTotal;
  const isSaving = difference < 0; 

  return (
    <View style={{ flex: 1 }}>
      {showPicker && (
        <DateTimePicker value={pickerTarget === 'date1' ? date1 : date2} mode="date" display="default" onChange={handleDateChange} />
      )}

      {/* Insight Modal */}
      <Portal>
        <Modal visible={showInsight} onDismiss={() => setShowInsight(false)} contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>📊 Spending Breakdown</Text>
          <ScrollView style={{ maxHeight: 300, marginTop: 10 }}>
            {insightData.map((item) => (
              <View key={item.category} style={styles.insightRow}>
                <View>
                  <Text style={styles.insightCat}>{item.category}</Text>
                  <Text style={styles.insightDetails}>₹{item.curr} (vs ₹{item.prev})</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                   <Text style={[styles.insightDiff, { color: item.diff > 0 ? '#FF5252' : '#4CAF50' }]}>
                     {item.diff > 0 ? `+₹${item.diff}` : `-₹${Math.abs(item.diff)}`}
                   </Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <Button mode="contained" onPress={() => setShowInsight(false)} style={styles.closeBtn} buttonColor="#1A1A1A" textColor="#FFF">Close Report</Button>
        </Modal>
      </Portal>

      <ScrollView>
        <Text style={styles.sectionTitle}>Compare Period</Text>
        <View style={styles.toggleRow}>
          {['Day', 'Week', 'Month'].map(mode => (
            <TouchableOpacity key={mode} style={[styles.toggleBtn, compareMode === mode && styles.activeToggle]} onPress={() => setCompareMode(mode)}>
              <Text style={[styles.toggleText, compareMode === mode && styles.activeToggleText]}>{mode}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.compareContainer}>
          {/* Card 1 */}
          <Surface style={styles.statCard} elevation={2}>
            <TouchableOpacity onPress={() => openDatePicker('date1')}>
                <Text style={styles.blueLink}>{getSmartLabel(date1)} ✏️</Text>
            </TouchableOpacity>
            <Text style={styles.statValue}>₹{currentTotal}</Text>
          </Surface>

          <View style={styles.vsBadge}><Text style={styles.vsText}>VS</Text></View>

          {/* Card 2 */}
          <Surface style={styles.statCard} elevation={2}>
             <TouchableOpacity onPress={() => openDatePicker('date2')}>
                <Text style={styles.blueLink}>{getSmartLabel(date2)} ✏️</Text>
            </TouchableOpacity>
            <Text style={styles.statValue}>₹{previousTotal}</Text>
          </Surface>
        </View>

        <Surface style={[styles.resultBanner, isSaving ? styles.goodResult : styles.badResult]} elevation={1}>
          <Text style={styles.resultTitle}>{isSaving ? "🎉 You Saved" : "⚠️ You Spent Extra"}</Text>
          <Text style={styles.resultAmount}>₹{Math.abs(difference)}</Text>
          <Button mode="contained" onPress={generateInsight} style={styles.insightBtn} buttonColor="rgba(0,0,0,0.1)" textColor="#1A1A1A" icon="chart-timeline-variant">See Breakdown</Button>
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 15, marginTop: 10, textTransform: 'uppercase' },
  toggleRow: { flexDirection: 'row', marginBottom: 20 },
  toggleBtn: { marginRight: 15, paddingBottom: 5 },
  activeToggle: { borderBottomWidth: 2, borderBottomColor: '#1A1A1A' },
  toggleText: { fontSize: 16, color: '#999', fontWeight: '600' },
  activeToggleText: { color: '#1A1A1A' },
  compareContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30, paddingHorizontal: 2 }, 
  statCard: { flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 16, alignItems: 'center', height: 120, justifyContent: 'center' },
  blueLink: { color: '#2575fc', fontSize: 13, fontWeight: '700', marginBottom: 5, textAlign: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  vsBadge: { backgroundColor: '#eee', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginHorizontal: -15, zIndex: 10, borderWidth: 3, borderColor: '#F5F7FA' },
  vsText: { fontSize: 12, fontWeight: '900', color: '#999' },
  resultBanner: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  goodResult: { backgroundColor: '#E0F7FA' }, 
  badResult: { backgroundColor: '#FFEBEE' },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  resultAmount: { fontSize: 32, fontWeight: '800', color: '#1A1A1A' },
  insightBtn: { marginTop: 15, width: '100%' },
  modalContainer: { backgroundColor: 'white', padding: 24, margin: 24, borderRadius: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  insightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  insightCat: { fontSize: 16, fontWeight: '600', color: '#333' },
  insightDetails: { fontSize: 12, color: '#999', marginTop: 2 },
  insightDiff: { fontSize: 16, fontWeight: 'bold' },
  closeBtn: { marginTop: 20, borderRadius: 12 },
});