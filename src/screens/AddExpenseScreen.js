import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Button, Text, Modal, Portal, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';

export default function AddExpenseScreen({ navigation, route }) {
  const { addExpense, editExpense, categories, paymentModes, upiApps, currency, budget, updateBudget, getTotalSpent, colors, showAlert } = useExpenses();
  
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

  // Budget Modal
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
    if (!name || !amount) { showAlert("Missing Info", "Please enter a title and amount."); return; }
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
  const currentTotal = getTotalSpent();
  const currentBudget = parseFloat(budget) || 0;
  const expenseAmount = parseFloat(amount) || 0;
  const remaining = currentBudget - currentTotal;
  const remainingAfter = remaining - expenseAmount;

  const Label = ({ icon, text }) => (
    <View style={styles.labelRow}>
        <IconButton icon={icon} size={18} iconColor={colors.textSec} style={{margin:0, marginRight: 5}} />
        <Text style={[styles.label, { color: colors.textSec }]}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      
      <Portal>
          <Modal visible={showBudgetModal} onDismiss={() => setShowBudgetModal(false)} contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Set Monthly Wallet</Text>
              <TextInput 
                  value={tempBudget} 
                  onChangeText={setTempBudget} 
                  keyboardType="numeric"
                  style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                  placeholder="e.g. 10000"
                  placeholderTextColor={colors.textSec}
              />
              <Button mode="contained" onPress={handleSaveBudget} buttonColor={colors.primary} textColor="#FFF">Save Limit</Button>
          </Modal>
      </Portal>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <IconButton icon="close" size={24} iconColor={colors.text} style={{margin: 0}} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditing ? 'Edit' : 'Add'} Expense</Text>
            
            <TouchableOpacity onPress={() => setShowBudgetModal(true)} style={[styles.walletBtn, { backgroundColor: colors.chip }]}>
                <IconButton icon="wallet-outline" size={16} iconColor={colors.text} style={{margin: 0, marginRight: 4}} />
                <Text style={[styles.walletBtnText, { color: colors.text }]}>{currency}{budget}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.amountContainer}>
            <Text style={[styles.currencySymbol, { color: colors.text }]}>{currency}</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textSec}
              style={[styles.amountInput, { color: colors.text }]}
            />
          </View>
          
          <View style={styles.liveCalc}>
            <Text style={{color: colors.textSec}}>Available: {currency}{remaining}</Text>
            <Text style={{color: colors.textSec}}> → </Text>
            <Text style={{color: remainingAfter < 0 ? colors.error : colors.success, fontWeight: 'bold'}}>
                After: {currency}{remainingAfter}
            </Text>
          </View>

          <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
            <Label icon="format-title" text="Title" />
            <TextInput style={[styles.simpleInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="e.g. Starbucks" placeholderTextColor={colors.textSec} value={name} onChangeText={setName} />

            <Label icon="credit-card-outline" text="Payment Method" />
            <View style={styles.chipContainer}>
              {paymentModes.map((mode) => (
                <TouchableOpacity key={mode} onPress={() => { setPaymentMode(mode); setPaymentApp(null); }} style={[styles.chip, paymentMode === mode ? { backgroundColor: colors.primary } : { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}>
                  <Text style={[styles.chipText, paymentMode === mode ? { color: '#FFF' } : { color: colors.text }]}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {paymentMode === 'UPI' && upiApps && upiApps.length > 0 && (
              <View style={styles.subOptionContainer}>
                <View style={styles.chipContainer}>
                  {upiApps.map((app) => (
                    <TouchableOpacity key={app} onPress={() => setPaymentApp(app === paymentApp ? null : app)} style={[styles.miniChip, paymentApp === app ? { backgroundColor: colors.chip, borderColor: colors.primary } : { borderColor: colors.border }]}>
                      <Text style={[styles.miniChipText, paymentApp === app ? { color: colors.text, fontWeight: 'bold' } : { color: colors.textSec }]}>{app}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Label icon="shape-outline" text="Category" />
            <View style={styles.chipContainer}>
              {categories.map((cat) => (
                <TouchableOpacity key={cat} onPress={() => setCategory(cat)} style={[styles.chip, category === cat ? { backgroundColor: colors.primary } : { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}>
                  <Text style={[styles.chipText, category === cat ? { color: '#FFF' } : { color: colors.text }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label icon="calendar-month-outline" text="Date" />
            <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.dateRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Text style={[styles.dateText, { color: colors.text }]}>{date.toDateString()}</Text>
              <IconButton icon="calendar" size={20} iconColor={colors.text} />
            </TouchableOpacity>
            {showPicker && (<DateTimePicker value={date} mode="date" display="default" onChange={(e, d) => { setShowPicker(false); if (d) setDate(d); }} />)}

            <Label icon="note-text-outline" text="Description (Optional)" />
            <TextInput style={[styles.simpleInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, height: 60, textAlignVertical: 'top' }]} placeholder="Add notes..." placeholderTextColor={colors.textSec} value={description} onChangeText={setDescription} multiline onFocus={() => setTimeout(() => scrollViewRef.current.scrollToEnd({ animated: true }), 100)} />

            <Button mode="contained" onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]} textColor="#FFF" labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>Save Expense</Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: 5 },
  iconBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  walletBtn: { flexDirection: 'row', alignItems: 'center', paddingRight: 12, paddingLeft: 0, borderRadius: 20 },
  walletBtnText: { fontSize: 13, fontWeight: 'bold' },
  amountContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 5 },
  currencySymbol: { fontSize: 32, fontWeight: 'bold', marginRight: 5 },
  amountInput: { fontSize: 32, fontWeight: 'bold', minWidth: 80, textAlign: 'center' },
  liveCalc: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  formSection: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 5 },
  label: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' },
  simpleInput: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1, marginBottom: 5 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 24, marginBottom: 4 },
  chipText: { fontSize: 13, fontWeight: '600' },
  subOptionContainer: { marginTop: 5, marginBottom: 5 },
  miniChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1 },
  miniChipText: { fontSize: 12 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  dateText: { fontSize: 15, fontWeight: '500' },
  saveBtn: { marginTop: 30, paddingVertical: 6, borderRadius: 16, elevation: 2, marginBottom: 20 },
  modalContainer: { padding: 20, margin: 40, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalInput: { marginBottom: 15, fontSize: 18, padding: 10, borderRadius: 8 }
});