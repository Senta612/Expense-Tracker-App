import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Button, Text, Modal, Portal, Provider } from 'react-native-paper'; // Import Portal/Modal
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';

export default function AddExpenseScreen({ navigation, route }) {
  const { addExpense, editExpense, categories, paymentModes, upiApps, currency, budget, updateBudget, getTotalSpent } = useExpenses();
  
  const existingExpense = route.params?.expense;
  const isEditing = !!existingExpense;

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories && categories.length > 0 ? categories[0] : 'Food');
  const [paymentMode, setPaymentMode] = useState(paymentModes && paymentModes.length > 0 ? paymentModes[0] : 'UPI');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [paymentApp, setPaymentApp] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  // --- NEW: Budget Modal State ---
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget);

  useEffect(() => {
    if (existingExpense) {
      setName(existingExpense.name);
      setAmount(existingExpense.amount.toString());
      setCategory(existingExpense.category);
      setDescription(existingExpense.description || '');
      setDate(new Date(existingExpense.date));
      setPaymentMode(existingExpense.paymentMode || 'UPI');
      setPaymentApp(existingExpense.paymentApp || null);
    }
  }, [existingExpense]);

  const handleSave = () => {
    if (!name || !amount) { Alert.alert("Missing Info", "Please enter details."); return; }
    const payload = {
      id: existingExpense ? existingExpense.id : Date.now().toString(),
      name,
      amount: parseFloat(amount),
      category,
      description,
      date: date.toISOString(),
      paymentMode,
      paymentApp: paymentMode === 'UPI' ? paymentApp : null,
    };
    if (isEditing) editExpense(payload); else addExpense(payload);
    navigation.goBack();
  };

  const handleSaveBudget = () => {
      updateBudget(tempBudget);
      setShowBudgetModal(false);
  };

  const scrollViewRef = useRef();
  
  // --- CALCULATION ---
  const currentTotal = getTotalSpent();
  const currentBudget = parseFloat(budget) || 0;
  const expenseAmount = parseFloat(amount) || 0;
  const remaining = currentBudget - currentTotal;
  const remainingAfter = remaining - expenseAmount;

  return (
    <Provider>
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
      
      {/* --- BUDGET MODAL --- */}
      <Portal>
          <Modal visible={showBudgetModal} onDismiss={() => setShowBudgetModal(false)} contentContainerStyle={styles.modalContainer}>
              <Text style={styles.modalTitle}>Set Monthly Wallet</Text>
              <TextInput 
                  value={tempBudget} 
                  onChangeText={setTempBudget} 
                  keyboardType="numeric"
                  style={styles.modalInput}
                  placeholder="e.g. 10000"
              />
              <Button mode="contained" onPress={handleSaveBudget} buttonColor="#1A1A1A">Save Limit</Button>
          </Modal>
      </Portal>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditing ? 'Edit' : 'Add'} Expense</Text>
            
            {/* --- NEW: WALLET BUTTON --- */}
            <TouchableOpacity onPress={() => setShowBudgetModal(true)} style={styles.walletBtn}>
                <Text style={styles.walletBtnText}>Wallet: {currency}{budget}</Text>
            </TouchableOpacity>
          </View>

          {/* Amount Section */}
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>{currency}</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#ddd"
              style={styles.amountInput}
            />
          </View>
          
          {/* --- NEW: LIVE CALCULATION --- */}
          <View style={styles.liveCalc}>
            <Text style={{color: '#888'}}>Available: {currency}{remaining}</Text>
            <Text style={{color: '#888'}}> → </Text>
            <Text style={{color: remainingAfter < 0 ? '#FF5252' : '#00C853', fontWeight: 'bold'}}>
                After: {currency}{remainingAfter}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.simpleInput} placeholder="e.g. Starbucks" placeholderTextColor="#999" value={name} onChangeText={setName} />

            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.chipContainer}>
              {paymentModes.map((mode) => (
                <TouchableOpacity key={mode} onPress={() => { setPaymentMode(mode); setPaymentApp(null); }} style={[styles.chip, paymentMode === mode ? styles.activeChip : styles.inactiveChip]}>
                  <Text style={[styles.chipText, paymentMode === mode ? styles.activeChipText : styles.inactiveChipText]}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {paymentMode === 'UPI' && upiApps && upiApps.length > 0 && (
              <View style={styles.subOptionContainer}>
                <View style={styles.chipContainer}>
                  {upiApps.map((app) => (
                    <TouchableOpacity key={app} onPress={() => setPaymentApp(app === paymentApp ? null : app)} style={[styles.miniChip, paymentApp === app ? styles.activeMiniChip : styles.inactiveMiniChip]}>
                      <Text style={[styles.miniChipText, paymentApp === app ? styles.activeMiniChipText : styles.inactiveMiniChipText]}>{app}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Text style={styles.label}>Category</Text>
            <View style={styles.chipContainer}>
              {categories.map((cat) => (
                <TouchableOpacity key={cat} onPress={() => setCategory(cat)} style={[styles.chip, category === cat ? styles.activeChip : styles.inactiveChip]}>
                  <Text style={[styles.chipText, category === cat ? styles.activeChipText : styles.inactiveChipText]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Date</Text>
            <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateRow}>
              <Text style={styles.dateText}>{date.toDateString()}</Text>
              <Text style={styles.calendarIcon}>📅</Text>
            </TouchableOpacity>
            {showPicker && (<DateTimePicker value={date} mode="date" display="default" onChange={(e, d) => { setShowPicker(false); if (d) setDate(d); }} />)}

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput style={[styles.simpleInput, { height: 60, textAlignVertical: 'top' }]} placeholder="Add notes..." placeholderTextColor="#999" value={description} onChangeText={setDescription} multiline onFocus={() => setTimeout(() => scrollViewRef.current.scrollToEnd({ animated: true }), 100)} />

            <Button mode="contained" onPress={handleSave} style={styles.saveBtn} textColor="#FFF" labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>Save</Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 5 },
  backBtn: { padding: 10 },
  backText: { fontSize: 22, color: '#333' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  
  walletBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  walletBtnText: { fontSize: 12, fontWeight: 'bold', color: '#1A1A1A' },

  amountContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 5, marginBottom: 5 },
  currencySymbol: { fontSize: 32, fontWeight: 'bold', color: '#1A1A1A', marginRight: 5 },
  amountInput: { fontSize: 32, fontWeight: 'bold', color: '#1A1A1A', minWidth: 80, textAlign: 'center' },
  
  liveCalc: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },

  formSection: { backgroundColor: '#F5F7FA', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, flex: 1 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#888', marginBottom: 8, marginTop: 12 },
  simpleInput: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#000', borderWidth: 1, borderColor: '#eee', marginBottom: 5 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginBottom: 4 },
  activeChip: { backgroundColor: '#1A1A1A' },
  inactiveChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
  chipText: { fontSize: 13, fontWeight: '600' },
  activeChipText: { color: '#fff' },
  inactiveChipText: { color: '#555' },
  subOptionContainer: { marginTop: 5, marginBottom: 5 },
  miniChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#ddd' },
  activeMiniChip: { backgroundColor: '#e0e0e0', borderColor: '#ccc' },
  inactiveMiniChip: { backgroundColor: 'transparent' },
  activeMiniChipText: { color: '#000', fontSize: 12, fontWeight: 'bold' },
  inactiveMiniChipText: { color: '#666', fontSize: 12 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  dateText: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  saveBtn: { marginTop: 'auto', paddingVertical: 4, backgroundColor: '#1A1A1A', borderRadius: 16, elevation: 0, marginBottom: 10 },
  
  modalContainer: { backgroundColor: 'white', padding: 20, margin: 40, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalInput: { backgroundColor: '#f0f0f0', marginBottom: 15, fontSize: 18, padding: 10, borderRadius: 8 }
});