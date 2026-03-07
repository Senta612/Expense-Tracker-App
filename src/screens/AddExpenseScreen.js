import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, Dimensions, LayoutAnimation, UIManager, Animated } from 'react-native';
import { Button, Text, IconButton, SegmentedButtons, Surface } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';
import AmountInput from '../components/AmountInput';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- TOAST COMPONENT ---
const ToastNotification = ({ message, visible, type, colors }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 10, friction: 8, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: -150, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible && slideAnim._value === -150) return null;

  return (
    <Animated.View style={[styles.toast, { transform: [{ translateY: slideAnim }], backgroundColor: type === 'error' ? colors.error : colors.success }]}>
      <IconButton icon={type === 'error' ? "alert-circle" : "check-circle"} iconColor="#FFF" size={24} style={{ margin: 0 }} />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

// ==========================================
// 1. EXPENSE FORM COMPONENT (Totally Isolated)
// ==========================================
const ExpenseForm = ({ initialData, onSaveData, colors, currency, categories, paymentModes, upiApps, availableBalance }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [category, setCategory] = useState(initialData?.category || categories[0] || 'Food');
  const [paymentMode, setPaymentMode] = useState(initialData?.paymentMode || paymentModes[0] || 'UPI');
  const [paymentApp, setPaymentApp] = useState(initialData?.paymentApp || null);
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData ? new Date(initialData.date) : new Date());

  const [showPicker, setShowPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const enteredAmount = parseFloat(amount) || 0;
  const remainingAfter = availableBalance - enteredAmount;

  const handleSave = () => {
    if (!name || !amount) { onSaveData({ error: "Enter Title & Amount" }); return; }
    setIsSaving(true);
    const payload = {
      id: initialData ? initialData.id : Date.now().toString(),
      type: 'expense',
      name, amount: parseFloat(amount), category, description,
      date: date.toISOString(), paymentMode,
      paymentApp: paymentMode === 'UPI' ? paymentApp : null,
    };
    onSaveData({ payload, resetLoading: () => setIsSaving(false) });
  };

  const Label = ({ icon, text }) => (
    <View style={styles.labelRow}>
      <IconButton icon={icon} size={18} iconColor={colors.textSec} style={{ margin: 0, marginRight: 5 }} />
      <Text style={[styles.label, { color: colors.textSec }]}>{text}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <AmountInput amount={amount} setAmount={setAmount} currency={currency} isIncome={false} color={colors.error} />

      <View style={styles.liveCalc}>
        <Text style={{ color: colors.textSec }}>Balance: {currency}{availableBalance.toLocaleString('en-IN')}</Text>
        <Text style={{ color: colors.textSec }}> → </Text>
        <Text style={{ color: colors.error, fontWeight: 'bold' }}>After: {currency}{remainingAfter.toLocaleString('en-IN')}</Text>
      </View>

      <Surface style={[styles.formSection, { backgroundColor: colors.surface }]}>
        <Label icon="format-title" text="Expense Title" />
        <TextInput style={[styles.simpleInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="e.g. Starbucks, Uber" placeholderTextColor={colors.textSec} value={name} onChangeText={setName} />

        <Label icon="shape-outline" text="Category" />
        <View style={styles.chipWrapContainer}>
          {categories.map((cat) => (
            <TouchableOpacity key={`exp-cat-${cat}`} onPress={() => setCategory(cat)} style={[styles.chip, category === cat ? { backgroundColor: colors.primary } : { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={[styles.chipText, category === cat ? { color: '#FFF' } : { color: colors.text }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Label icon="credit-card-outline" text="Payment Method" />
        <View style={styles.chipWrapContainer}>
          {paymentModes.map((mode) => (
            <TouchableOpacity key={`exp-mode-${mode}`} onPress={() => { setPaymentMode(mode); setPaymentApp(null); }} style={[styles.chip, paymentMode === mode ? { backgroundColor: colors.primary } : { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={[styles.chipText, paymentMode === mode ? { color: '#FFF' } : { color: colors.text }]}>{mode}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {paymentMode === 'UPI' && upiApps && upiApps.length > 0 && (
          <View style={styles.subOptionContainer}>
            <View style={styles.chipWrapContainer}>
              {upiApps.map((app) => (
                <TouchableOpacity key={`exp-app-${app}`} onPress={() => setPaymentApp(app === paymentApp ? null : app)} style={[styles.miniChip, paymentApp === app ? { backgroundColor: colors.chip, borderColor: colors.primary } : { borderColor: colors.border }]}>
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
        <TextInput style={[styles.simpleInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, height: 60, textAlignVertical: 'top' }]} placeholder="Add notes..." placeholderTextColor={colors.textSec} value={description} onChangeText={setDescription} multiline />

        <Button mode="contained" onPress={handleSave} loading={isSaving} style={[styles.saveBtn, { backgroundColor: colors.error }]} textColor="#FFF" labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>
          {isSaving ? "Saving..." : "Save Expense"}
        </Button>
      </Surface>
    </ScrollView>
  );
};

// ==========================================
// 2. INCOME FORM COMPONENT (Totally Isolated)
// ==========================================
const IncomeForm = ({ initialData, onSaveData, colors, currency, availableBalance }) => {
  const incomeFrequencies = ['One-time', 'Weekly', 'Monthly', 'Yearly'];

  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [paymentMode, setPaymentMode] = useState(initialData?.paymentMode || 'One-time');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData ? new Date(initialData.date) : new Date());

  const [showPicker, setShowPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const enteredAmount = parseFloat(amount) || 0;
  const remainingAfter = availableBalance + enteredAmount;

  const handleSave = () => {
    if (!name || !amount) { onSaveData({ error: "Enter Title & Amount" }); return; }
    setIsSaving(true);
    const payload = {
      id: initialData ? initialData.id : Date.now().toString(),
      type: 'income',
      name, amount: parseFloat(amount), category: 'Income', description,
      date: date.toISOString(), paymentMode, paymentApp: null,
    };
    onSaveData({ payload, resetLoading: () => setIsSaving(false) });
  };

  const Label = ({ icon, text }) => (
    <View style={styles.labelRow}>
      <IconButton icon={icon} size={18} iconColor={colors.textSec} style={{ margin: 0, marginRight: 5 }} />
      <Text style={[styles.label, { color: colors.textSec }]}>{text}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <AmountInput amount={amount} setAmount={setAmount} currency={currency} isIncome={true} color="#00C853" />

      <View style={styles.liveCalc}>
        <Text style={{ color: colors.textSec }}>Balance: {currency}{availableBalance.toLocaleString('en-IN')}</Text>
        <Text style={{ color: colors.textSec }}> → </Text>
        <Text style={{ color: '#00C853', fontWeight: 'bold' }}>After: {currency}{remainingAfter.toLocaleString('en-IN')}</Text>
      </View>

      <Surface style={[styles.formSection, { backgroundColor: colors.surface }]}>
        <Label icon="format-title" text="Income Source" />
        <TextInput style={[styles.simpleInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="e.g. Salary, Freelance, Gift" placeholderTextColor={colors.textSec} value={name} onChangeText={setName} />

        <Label icon="calendar-sync" text="Income Frequency" />
        <View style={styles.chipWrapContainer}>
          {incomeFrequencies.map((mode) => (
            <TouchableOpacity key={`inc-mode-${mode}`} onPress={() => setPaymentMode(mode)} style={[styles.chip, paymentMode === mode ? { backgroundColor: colors.primary } : { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={[styles.chipText, paymentMode === mode ? { color: '#FFF' } : { color: colors.text }]}>{mode}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Label icon="calendar-month-outline" text="Date Received" />
        <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.dateRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Text style={[styles.dateText, { color: colors.text }]}>{date.toDateString()}</Text>
          <IconButton icon="calendar" size={20} iconColor={colors.text} />
        </TouchableOpacity>
        {showPicker && (<DateTimePicker value={date} mode="date" display="default" onChange={(e, d) => { setShowPicker(false); if (d) setDate(d); }} />)}

        <Label icon="note-text-outline" text="Notes (Optional)" />
        <TextInput style={[styles.simpleInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, height: 60, textAlignVertical: 'top' }]} placeholder="Add notes..." placeholderTextColor={colors.textSec} value={description} onChangeText={setDescription} multiline />

        <Button mode="contained" onPress={handleSave} loading={isSaving} style={[styles.saveBtn, { backgroundColor: '#00C853' }]} textColor="#FFF" labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>
          {isSaving ? "Saving..." : "Add to Wallet"}
        </Button>
      </Surface>
    </ScrollView>
  );
};


// ==========================================
// 3. MAIN SCREEN WRAPPER
// ==========================================
export default function AddExpenseScreen({ navigation, route }) {
  const { addExpense, editExpense, categories, paymentModes, upiApps, currency, getBalanceData, colors } = useExpenses();

  const existingExpense = route.params?.expense;
  const isEditing = !!existingExpense;

  const [transactionType, setTransactionType] = useState('expense');
  const [toast, setToast] = useState({ visible: false, message: '', type: '' });
  const horizontalScrollRef = useRef(null);

  const { availableBalance } = getBalanceData();

  useEffect(() => {
    if (existingExpense) {
      const type = existingExpense.type || 'expense';
      setTransactionType(type);
      setTimeout(() => {
        if (type === 'income') horizontalScrollRef.current?.scrollTo({ x: width, animated: false });
      }, 100);
    }
  }, [existingExpense]);

  const handleTabTap = (value) => {
    setTransactionType(value);
    const index = value === 'expense' ? 0 : 1;
    horizontalScrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleScrollEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    const newType = index === 0 ? 'expense' : 'income';
    if (transactionType !== newType) {
      setTransactionType(newType);
    }
  };

  const showToast = (msg, type = 'error') => {
    setToast({ visible: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleSaveData = ({ error, payload, resetLoading }) => {
    if (error) {
      showToast(error, 'error');
      return;
    }

    setTimeout(() => {
      if (isEditing) editExpense(payload);
      else addExpense(payload);

      resetLoading();
      navigation.goBack();
    }, 400);
  };

  const expenseInitialData = isEditing && existingExpense.type !== 'income' ? existingExpense : null;
  const incomeInitialData = isEditing && existingExpense.type === 'income' ? existingExpense : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>

      <ToastNotification visible={toast.visible} message={toast.message} type={toast.type} colors={colors} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <IconButton icon="close" size={24} iconColor={colors.text} style={{ margin: 0 }} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditing ? 'Edit' : 'New'} Transaction</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* TOP TOGGLE BUTTONS */}
        <View style={styles.toggleContainer}>
          <SegmentedButtons
            value={transactionType}
            onValueChange={handleTabTap}
            buttons={[
              { value: 'expense', label: 'Expense', style: { backgroundColor: transactionType === 'expense' ? colors.error + '15' : 'transparent', borderColor: colors.border } },
              { value: 'income', label: 'Income', style: { backgroundColor: transactionType === 'income' ? '#00C85315' : 'transparent', borderColor: colors.border } },
            ]}
            theme={{ colors: { secondaryContainer: 'transparent', onSecondaryContainer: transactionType === 'expense' ? colors.error : '#00C853', outline: colors.border } }}
          />
        </View>

        {/* SWIPABLE TABS */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          ref={horizontalScrollRef}
          onMomentumScrollEnd={handleScrollEnd}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
        >
          <View style={{ width }}>
            <ExpenseForm
              initialData={expenseInitialData}
              onSaveData={handleSaveData}
              colors={colors} currency={currency} categories={categories} paymentModes={paymentModes} upiApps={upiApps} availableBalance={availableBalance}
            />
          </View>
          <View style={{ width }}>
            <IncomeForm
              initialData={incomeInitialData}
              onSaveData={handleSaveData}
              colors={colors} currency={currency} availableBalance={availableBalance}
            />
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
  toggleContainer: { marginHorizontal: 40, marginTop: 15 },
  liveCalc: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  formSection: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40, elevation: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 5 },
  label: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' },
  simpleInput: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1, marginBottom: 5 },
  chipWrapContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 5 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 24, marginBottom: 8, marginRight: 8 },
  chipText: { fontSize: 13, fontWeight: '600' },
  subOptionContainer: { marginTop: 5, marginBottom: 5 },
  miniChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  miniChipText: { fontSize: 12 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  dateText: { fontSize: 15, fontWeight: '500' },
  saveBtn: { marginTop: 30, paddingVertical: 6, borderRadius: 16, elevation: 2, marginBottom: 20 },
  toast: { position: 'absolute', top: 10, alignSelf: 'center', width: '92%', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', zIndex: 1000, elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  toastText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, flex: 1, marginLeft: 5 },
});