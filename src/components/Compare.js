import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button, Surface, Portal, Modal, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useExpenses } from '../context/ExpenseContext';

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Other'];

export default function Compare({ expenses }) {
  // 1. Get Colors & Currency from Context
  const { colors, currency } = useExpenses();

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
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(d); target.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

    if (compareMode === 'Day') {
        if (target.getTime() === today.getTime()) return "Today";
        if (target.getTime() === yesterday.getTime()) return "Yesterday";
        return d.toDateString();
    }
    if (compareMode === 'Week') {
        const { startDate, endDate } = getDateRangeForTarget(d);
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
  const resultColor = isSaving ? colors.success : colors.error;

  return (
    <View style={{ flex: 1 }}>
      {showPicker && (
        <DateTimePicker value={pickerTarget === 'date1' ? date1 : date2} mode="date" display="default" onChange={handleDateChange} />
      )}

      {/* Insight Modal */}
      <Portal>
        <Modal visible={showInsight} onDismiss={() => setShowInsight(false)} contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Spending Breakdown</Text>
          <ScrollView style={{ maxHeight: 300, marginTop: 10 }}>
            {insightData.map((item) => (
              <View key={item.category} style={[styles.insightRow, { borderColor: colors.border }]}>
                <View>
                  <Text style={[styles.insightCat, { color: colors.text }]}>{item.category}</Text>
                  <Text style={[styles.insightDetails, { color: colors.textSec }]}>{currency}{item.curr} (vs {currency}{item.prev})</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                   <Text style={[styles.insightDiff, { color: item.diff > 0 ? colors.error : colors.success }]}>
                     {item.diff > 0 ? `+${currency}${item.diff}` : `-${currency}${Math.abs(item.diff)}`}
                   </Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <Button mode="contained" onPress={() => setShowInsight(false)} style={styles.closeBtn} buttonColor={colors.primary} textColor="#FFF">Close Report</Button>
        </Modal>
      </Portal>

      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <Text style={[styles.sectionTitle, { color: colors.textSec }]}>Compare Period</Text>
        
        {/* Toggle Row */}
        <View style={styles.toggleRow}>
          {['Day', 'Week', 'Month'].map(mode => (
            <TouchableOpacity 
                key={mode} 
                style={[styles.toggleBtn, compareMode === mode && { borderBottomColor: colors.text }]} 
                onPress={() => setCompareMode(mode)}
            >
              <Text style={[styles.toggleText, { color: compareMode === mode ? colors.text : colors.textSec }]}>{mode}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Comparison Cards */}
        <View style={styles.compareContainer}>
          {/* Card 1 */}
          <Surface style={[styles.statCard, { backgroundColor: colors.surface }]} elevation={2}>
            <TouchableOpacity onPress={() => openDatePicker('date1')} style={styles.dateTouch}>
                <Text style={[styles.blueLink, { color: colors.primary }]}>{getSmartLabel(date1)}</Text>
                <IconButton icon="pencil" size={14} iconColor={colors.primary} style={{margin: 0}} />
            </TouchableOpacity>
            <Text style={[styles.statValue, { color: colors.text }]}>{currency}{currentTotal}</Text>
          </Surface>

          {/* VS Badge */}
          <View style={[styles.vsBadge, { backgroundColor: colors.inputBg, borderColor: colors.background }]}>
            <Text style={[styles.vsText, { color: colors.textSec }]}>VS</Text>
          </View>

          {/* Card 2 */}
          <Surface style={[styles.statCard, { backgroundColor: colors.surface }]} elevation={2}>
             <TouchableOpacity onPress={() => openDatePicker('date2')} style={styles.dateTouch}>
                <Text style={[styles.blueLink, { color: colors.primary }]}>{getSmartLabel(date2)}</Text>
                <IconButton icon="pencil" size={14} iconColor={colors.primary} style={{margin: 0}} />
            </TouchableOpacity>
            <Text style={[styles.statValue, { color: colors.text }]}>{currency}{previousTotal}</Text>
          </Surface>
        </View>

        {/* Result Banner */}
        <Surface style={[
            styles.resultBanner, 
            { backgroundColor: colors.surface, borderColor: resultColor, borderWidth: 1 }
        ]} elevation={1}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
              <IconButton icon={isSaving ? "check-circle" : "alert-circle"} size={20} iconColor={resultColor} style={{margin:0, marginRight: 5}}/>
              <Text style={[styles.resultTitle, { color: colors.text }]}>{isSaving ? "You Saved" : "You Spent Extra"}</Text>
          </View>
          
          <Text style={[styles.resultAmount, { color: resultColor }]}>{currency}{Math.abs(difference)}</Text>
          
          <Button 
            mode="contained" 
            onPress={generateInsight} 
            style={[styles.insightBtn, { backgroundColor: colors.inputBg }]} 
            textColor={colors.text} 
            icon="chart-timeline-variant"
          >
            See Breakdown
          </Button>
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 15, marginTop: 10, textTransform: 'uppercase' },
  toggleRow: { flexDirection: 'row', marginBottom: 20 },
  toggleBtn: { marginRight: 15, paddingBottom: 5, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  toggleText: { fontSize: 16, fontWeight: '600' },
  
  compareContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30, paddingHorizontal: 2 }, 
  statCard: { flex: 1, padding: 10, borderRadius: 16, alignItems: 'center', height: 110, justifyContent: 'center' },
  dateTouch: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  blueLink: { fontSize: 13, fontWeight: '700' },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  
  vsBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginHorizontal: -15, zIndex: 10, borderWidth: 3 },
  vsText: { fontSize: 12, fontWeight: '900' },
  
  resultBanner: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  resultTitle: { fontSize: 18, fontWeight: 'bold' },
  resultAmount: { fontSize: 32, fontWeight: '800' },
  insightBtn: { marginTop: 15, width: '100%', borderRadius: 12 },
  
  modalContainer: { padding: 24, margin: 24, borderRadius: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  insightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  insightCat: { fontSize: 16, fontWeight: '600' },
  insightDetails: { fontSize: 12, marginTop: 2 },
  insightDiff: { fontSize: 16, fontWeight: 'bold' },
  closeBtn: { marginTop: 20, borderRadius: 12 },
});