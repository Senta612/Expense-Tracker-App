import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native'; 
import { Button, Text, Chip } from 'react-native-paper'; // Imported Chip
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Other'];
const MODES = ['UPI', 'Cash', 'Card']; // Default Modes

export default function AddExpenseScreen({ navigation, route }) {
  const { addExpense, updateExpense, upiApps } = useExpenses(); // Get upiApps
  const existingExpense = route.params?.expense;
  const isEditing = !!existingExpense;

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  
  // --- NEW: Payment State ---
  const [paymentMode, setPaymentMode] = useState('UPI'); // Default UPI
  const [paymentApp, setPaymentApp] = useState(null);    // e.g. 'GPay'

  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (existingExpense) {
      setName(existingExpense.name);
      setAmount(existingExpense.amount.toString());
      setCategory(existingExpense.category);
      setDescription(existingExpense.description || '');
      setDate(new Date(existingExpense.date));
      // Load Mode
      setPaymentMode(existingExpense.paymentMode || 'UPI');
      setPaymentApp(existingExpense.paymentApp || null);
    }
  }, [existingExpense]);

  const handleSave = () => {
    if (!name || !amount) {
      Alert.alert("Missing Info", "Please enter details.");
      return;
    }

    const payload = {
      name,
      amount: parseFloat(amount),
      category,
      description,
      date: date.toISOString(),
      paymentMode, // Save Mode
      paymentApp: paymentMode === 'UPI' ? paymentApp : null, // Save App only if UPI
    };

    if (isEditing) {
      updateExpense(existingExpense.id, payload);
    } else {
      addExpense(payload);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit' : 'Add'} Expense</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#ddd"
            style={styles.amountInput}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.simpleInput}
            placeholder="e.g. Starbucks"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />

          {/* --- NEW: Payment Mode Selector --- */}
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.chipContainer}>
            {MODES.map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => { setPaymentMode(mode); setPaymentApp(null); }} // Reset App if mode changes
                style={[styles.chip, paymentMode === mode ? styles.activeChip : styles.inactiveChip]}
              >
                <Text style={[styles.chipText, paymentMode === mode ? styles.activeChipText : styles.inactiveChipText]}>{mode}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* --- NEW: Payment App Selector (Only if UPI) --- */}
          {paymentMode === 'UPI' && (
             <View style={styles.subOptionContainer}>
                <Text style={styles.subLabel}>Which App?</Text>
                <View style={styles.chipContainer}>
                  {upiApps.map((app) => (
                    <TouchableOpacity
                      key={app}
                      onPress={() => setPaymentApp(app === paymentApp ? null : app)} // Toggle
                      style={[styles.miniChip, paymentApp === app ? styles.activeMiniChip : styles.inactiveMiniChip]}
                    >
                      <Text style={[styles.miniChipText, paymentApp === app ? styles.activeMiniChipText : styles.inactiveMiniChipText]}>{app}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
             </View>
          )}

          <Text style={styles.label}>Category</Text>
          <View style={styles.chipContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={[styles.chip, category === cat ? styles.activeChip : styles.inactiveChip]}
              >
                <Text style={[styles.chipText, category === cat ? styles.activeChipText : styles.inactiveChipText]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Date</Text>
          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateRow}>
            <Text style={styles.dateText}>{date.toDateString()}</Text>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker value={date} mode="date" display="default" onChange={(e, d) => { setShowPicker(false); if(d) setDate(d); }} />
          )}

          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.simpleInput, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Add notes..."
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Button mode="contained" onPress={handleSave} style={styles.saveBtn} textColor="#FFF" labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>
            Save
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 5 },
  backBtn: { padding: 10 },
  backText: { fontSize: 22, color: '#333' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  amountContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  currencySymbol: { fontSize: 36, fontWeight: 'bold', color: '#1A1A1A', marginRight: 5 },
  amountInput: { fontSize: 36, fontWeight: 'bold', color: '#1A1A1A', minWidth: 80, textAlign: 'center' },
  formSection: { backgroundColor: '#F5F7FA', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, flex: 1, minHeight: 500 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#888', marginBottom: 8, marginTop: 12 },
  simpleInput: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#000', borderWidth: 1, borderColor: '#eee', marginBottom: 5 },
  
  // Chip Styles
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginBottom: 4 },
  activeChip: { backgroundColor: '#1A1A1A' },
  inactiveChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
  chipText: { fontSize: 13, fontWeight: '600' },
  activeChipText: { color: '#fff' },
  inactiveChipText: { color: '#555' },

  // Mini Chips for Payment Apps
  subOptionContainer: { marginTop: 5, marginBottom: 10, marginLeft: 5 },
  subLabel: { fontSize: 11, color: '#aaa', marginBottom: 5, fontWeight: '600' },
  miniChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#ddd' },
  activeMiniChip: { backgroundColor: '#e0e0e0', borderColor: '#ccc' },
  inactiveMiniChip: { backgroundColor: 'transparent' },
  activeMiniChipText: { color: '#000', fontSize: 12, fontWeight: 'bold' },
  inactiveMiniChipText: { color: '#666', fontSize: 12 },

  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  dateText: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  calendarIcon: { fontSize: 16 },
  saveBtn: { marginTop: 30, backgroundColor: '#1A1A1A', borderRadius: 16, elevation: 0 }
});