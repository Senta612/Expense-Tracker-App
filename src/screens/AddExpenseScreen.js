import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Button, Text, IconButton, SegmentedButtons } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';
import AmountInput from '../components/AmountInput'; // <--- Import the new component

export default function AddExpenseScreen({ navigation, route }) {
  const { addExpense, editExpense, categories, paymentModes, upiApps, currency, getBalanceData, colors, showAlert } = useExpenses();
  
  const existingExpense = route.params?.expense;
  const isEditing = !!existingExpense;

  // --- 1. NEW STATE: Transaction Type ('expense' or 'income') ---
  const [transactionType, setTransactionType] = useState('expense'); 

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories && categories.length > 0 ? categories[0] : 'Food');
  const [paymentMode, setPaymentMode] = useState(paymentModes && paymentModes.length > 0 ? paymentModes[0] : 'UPI');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [paymentApp, setPaymentApp] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (existingExpense) {
      setName(existingExpense.name);
      setAmount(existingExpense.amount.toString());
      setCategory(existingExpense.category);
      setDescription(existingExpense.description || '');
      setDate(new Date(existingExpense.date));
      setPaymentMode(existingExpense.paymentMode || 'UPI');
      setPaymentApp(existingExpense.paymentApp || null);
      setTransactionType(existingExpense.type || 'expense'); // Load Type
    }
  }, [existingExpense]);

  const handleSave = () => {
    if (!name || !amount) { showAlert("Missing Info", "Please enter a title and amount."); return; }
    
    const payload = {
      id: existingExpense ? existingExpense.id : Date.now().toString(),
      type: transactionType, // 'expense' or 'income'
      name,
      amount: parseFloat(amount),
      // Auto-set category for income to keep reports clean
      category: transactionType === 'income' ? 'Income' : category, 
      description,
      date: date.toISOString(),
      paymentMode,
      paymentApp: paymentMode === 'UPI' ? paymentApp : null,
    };

    if (isEditing) editExpense(payload); else addExpense(payload);
    navigation.goBack();
  };

  const scrollViewRef = useRef();
  
  // --- 2. LIVE CALCULATION LOGIC ---
  const { availableBalance } = getBalanceData(); // Get current actual balance
  const enteredAmount = parseFloat(amount) || 0;
  
  // If Expense: Balance goes DOWN (-). If Income: Balance goes UP (+).
  const remainingAfter = transactionType === 'expense' 
      ? availableBalance - enteredAmount 
      : availableBalance + enteredAmount;

  // Helper Component for UI consistency
  const Label = ({ icon, text }) => (
    <View style={styles.labelRow}>
        <IconButton icon={icon} size={18} iconColor={colors.textSec} style={{margin:0, marginRight: 5}} />
        <Text style={[styles.label, { color: colors.textSec }]}>{text}</Text>
    </View>
  );

  // Dynamic Theme Color (Red for Expense, Green for Income)
  const activeColor = transactionType === 'expense' ? colors.error : '#00C853';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* HEADER (Removed Wallet Button) */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <IconButton icon="close" size={24} iconColor={colors.text} style={{margin: 0}} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditing ? 'Edit' : 'New'} Transaction</Text>
            <View style={{width: 40}} /> 
          </View>

          {/* TOGGLE SWITCH */}
          <View style={styles.toggleContainer}>
            <SegmentedButtons
                value={transactionType}
                onValueChange={setTransactionType}
                buttons={[
                { 
                    value: 'expense', 
                    label: 'Expense', 
                    icon: 'arrow-up-bold',
                    style: { backgroundColor: transactionType === 'expense' ? colors.error + '15' : 'transparent', borderColor: colors.border }
                },
                { 
                    value: 'income', 
                    label: 'Income', 
                    icon: 'arrow-down-bold',
                    style: { backgroundColor: transactionType === 'income' ? '#00C85315' : 'transparent', borderColor: colors.border } 
                },
                ]}
                theme={{ colors: { secondaryContainer: 'transparent', onSecondaryContainer: activeColor, outline: colors.border } }}
            />
          </View>

          {/* AMOUNT INPUT COMPONENT */}
          <AmountInput 
            amount={amount} 
            setAmount={setAmount} 
            currency={currency} 
            isIncome={transactionType === 'income'}
            color={transactionType === 'income' ? '#00C853' : colors.text} // Green for income, Default for expense
          />
          
          {/* LIVE BALANCE PREVIEW */}
          <View style={styles.liveCalc}>
            <Text style={{color: colors.textSec}}>Balance: {currency}{availableBalance.toLocaleString('en-IN')}</Text>
            <Text style={{color: colors.textSec}}> → </Text>
            <Text style={{color: activeColor, fontWeight: 'bold'}}>
                After: {currency}{remainingAfter.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* FORM CONTAINER */}
          <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
            
            <Label icon="format-title" text="Title" />
            <TextInput style={[styles.simpleInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder={transactionType === 'income' ? "e.g. Salary, Gift" : "e.g. Starbucks"} placeholderTextColor={colors.textSec} value={name} onChangeText={setName} />

            {/* HIDE CATEGORY IF INCOME */}
            {transactionType === 'expense' && (
                <>
                    <Label icon="shape-outline" text="Category" />
                    <View style={styles.chipContainer}>
                    {categories.map((cat) => (
                        <TouchableOpacity key={cat} onPress={() => setCategory(cat)} style={[styles.chip, category === cat ? { backgroundColor: colors.primary } : { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}>
                        <Text style={[styles.chipText, category === cat ? { color: '#FFF' } : { color: colors.text }]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                    </View>
                </>
            )}

            <Label icon="credit-card-outline" text={transactionType === 'income' ? "Received Via" : "Payment Method"} />
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

            <Label icon="calendar-month-outline" text="Date" />
            <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.dateRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Text style={[styles.dateText, { color: colors.text }]}>{date.toDateString()}</Text>
              <IconButton icon="calendar" size={20} iconColor={colors.text} />
            </TouchableOpacity>
            {showPicker && (<DateTimePicker value={date} mode="date" display="default" onChange={(e, d) => { setShowPicker(false); if (d) setDate(d); }} />)}

            <Label icon="note-text-outline" text="Description (Optional)" />
            <TextInput style={[styles.simpleInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, height: 60, textAlignVertical: 'top' }]} placeholder="Add notes..." placeholderTextColor={colors.textSec} value={description} onChangeText={setDescription} multiline onFocus={() => setTimeout(() => scrollViewRef.current.scrollToEnd({ animated: true }), 100)} />

            {/* SAVE BUTTON (Changes color based on type) */}
            <Button 
                mode="contained" 
                onPress={handleSave} 
                style={[styles.saveBtn, { backgroundColor: activeColor }]} 
                textColor="#FFF" 
                labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
            >
                {transactionType === 'income' ? 'Add to Wallet' : 'Save Expense'}
            </Button>
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
  
  toggleContainer: { marginHorizontal: 40, marginTop: 15 }, // Centered Toggle

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
});