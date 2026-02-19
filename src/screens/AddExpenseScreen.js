import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, Animated, Dimensions, LayoutAnimation, UIManager } from 'react-native';
import { Button, Text, IconButton, SegmentedButtons, Surface } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';
import AmountInput from '../components/AmountInput'; 

const { width } = Dimensions.get('window');

// Enable Layout Animation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- FIXED TOAST COMPONENT (Hidden by default) ---
const ToastNotification = ({ message, visible, type, colors }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current; // Start OFF SCREEN

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 10, friction: 8, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: -150, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible && slideAnim._value === -150) return null; // Unmount if hidden

  return (
    <Animated.View style={[styles.toast, { transform: [{ translateY: slideAnim }], backgroundColor: type === 'error' ? colors.error : colors.success }]}>
      <IconButton icon={type === 'error' ? "alert-circle" : "check-circle"} iconColor="#FFF" size={24} style={{margin:0}} />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

export default function AddExpenseScreen({ navigation, route }) {
  const { addExpense, editExpense, categories, paymentModes, upiApps, currency, getBalanceData, colors } = useExpenses();
  
  const existingExpense = route.params?.expense;
  const isEditing = !!existingExpense;

  // --- STATE ---
  const [transactionType, setTransactionType] = useState('expense'); 
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Food');
  const [paymentMode, setPaymentMode] = useState(paymentModes[0] || 'UPI');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [paymentApp, setPaymentApp] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  // UI States
  const [toast, setToast] = useState({ visible: false, message: '', type: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Animation for Form Slide
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (existingExpense) {
      setName(existingExpense.name);
      setAmount(existingExpense.amount.toString());
      setCategory(existingExpense.category);
      setDescription(existingExpense.description || '');
      setDate(new Date(existingExpense.date));
      setPaymentMode(existingExpense.paymentMode || 'UPI');
      setPaymentApp(existingExpense.paymentApp || null);
      setTransactionType(existingExpense.type || 'expense');
    }
  }, [existingExpense]);

  // --- ANIMATED TYPE SWITCH ---
  const handleTypeChange = (value) => {
    // 1. Fade Out
    Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
        // 2. Change Data
        setTransactionType(value);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); // Smooth layout transition
        
        // 3. Fade In
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const showToast = (msg, type = 'error') => {
    setToast({ visible: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleSave = () => {
    if (!name || !amount) { 
        showToast("Enter Title & Amount", 'error'); 
        return; 
    }
    
    setIsSaving(true); 

    const payload = {
      id: existingExpense ? existingExpense.id : Date.now().toString(),
      type: transactionType, 
      name,
      amount: parseFloat(amount),
      category: transactionType === 'income' ? 'Income' : category, 
      description,
      date: date.toISOString(),
      paymentMode,
      paymentApp: paymentMode === 'UPI' ? paymentApp : null,
    };

    setTimeout(() => {
        if (isEditing) editExpense(payload); else addExpense(payload);
        setIsSaving(false);
        navigation.goBack();
    }, 500);
  };

  const scrollViewRef = useRef();
  const { availableBalance } = getBalanceData(); 
  const enteredAmount = parseFloat(amount) || 0;
  const remainingAfter = transactionType === 'expense' 
      ? availableBalance - enteredAmount 
      : availableBalance + enteredAmount;

  const Label = ({ icon, text }) => (
    <View style={styles.labelRow}>
        <IconButton icon={icon} size={18} iconColor={colors.textSec} style={{margin:0, marginRight: 5}} />
        <Text style={[styles.label, { color: colors.textSec }]}>{text}</Text>
    </View>
  );

  const activeColor = transactionType === 'expense' ? colors.error : '#00C853';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      
      {/* 🔔 CUSTOM TOAST (Now properly z-indexed and animated) */}
      <ToastNotification visible={toast.visible} message={toast.message} type={toast.type} colors={colors} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <IconButton icon="close" size={24} iconColor={colors.text} style={{margin: 0}} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditing ? 'Edit' : 'New'} Transaction</Text>
            <View style={{width: 40}} /> 
          </View>

          {/* TYPE TOGGLE (NO Swipe, just Tap) */}
          <View style={styles.toggleContainer}>
            <SegmentedButtons
                value={transactionType}
                onValueChange={handleTypeChange}
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

          {/* ANIMATED FORM CONTENT */}
          <Animated.View style={{ opacity: fadeAnim }}>
            
            {/* AMOUNT INPUT */}
            <AmountInput 
                amount={amount} 
                setAmount={setAmount} 
                currency={currency} 
                isIncome={transactionType === 'income'}
                color={transactionType === 'income' ? '#00C853' : colors.text} 
            />
            
            {/* LIVE BALANCE */}
            <View style={styles.liveCalc}>
                <Text style={{color: colors.textSec}}>Balance: {currency}{availableBalance.toLocaleString('en-IN')}</Text>
                <Text style={{color: colors.textSec}}> → </Text>
                <Text style={{color: activeColor, fontWeight: 'bold'}}>
                    After: {currency}{remainingAfter.toLocaleString('en-IN')}
                </Text>
            </View>

            {/* DETAILS FORM */}
            <Surface style={[styles.formSection, { backgroundColor: colors.surface }]}>
                
                <Label icon="format-title" text="Title" />
                <TextInput style={[styles.simpleInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder={transactionType === 'income' ? "e.g. Salary, Gift" : "e.g. Starbucks"} placeholderTextColor={colors.textSec} value={name} onChangeText={setName} />

                {/* CATEGORY (Only for Expense) */}
                {transactionType === 'expense' && (
                    <>
                        <Label icon="shape-outline" text="Category" />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                        {categories.map((cat) => (
                            <TouchableOpacity key={cat} onPress={() => setCategory(cat)} style={[styles.chip, category === cat ? { backgroundColor: colors.primary } : { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}>
                            <Text style={[styles.chipText, category === cat ? { color: '#FFF' } : { color: colors.text }]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                        </ScrollView>
                    </>
                )}

                <Label icon="credit-card-outline" text={transactionType === 'income' ? "Received Via" : "Payment Method"} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {paymentModes.map((mode) => (
                    <TouchableOpacity key={mode} onPress={() => { setPaymentMode(mode); setPaymentApp(null); }} style={[styles.chip, paymentMode === mode ? { backgroundColor: colors.primary } : { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}>
                    <Text style={[styles.chipText, paymentMode === mode ? { color: '#FFF' } : { color: colors.text }]}>{mode}</Text>
                    </TouchableOpacity>
                ))}
                </ScrollView>

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

                <Button 
                    mode="contained" 
                    onPress={handleSave} 
                    loading={isSaving}
                    style={[styles.saveBtn, { backgroundColor: activeColor }]} 
                    textColor="#FFF" 
                    labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                >
                    {isSaving ? "Saving..." : (transactionType === 'income' ? 'Add to Wallet' : 'Save Expense')}
                </Button>
            </Surface>
          </Animated.View>
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
  chipScroll: { flexDirection: 'row', marginBottom: 5 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 24, marginBottom: 4, marginRight: 8 },
  chipText: { fontSize: 13, fontWeight: '600' },
  subOptionContainer: { marginTop: 5, marginBottom: 5 },
  miniChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1 },
  miniChipText: { fontSize: 12 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  dateText: { fontSize: 15, fontWeight: '500' },
  saveBtn: { marginTop: 30, paddingVertical: 6, borderRadius: 16, elevation: 2, marginBottom: 20 },

  // TOAST STYLES
  toast: { position: 'absolute', top: 10, alignSelf: 'center', width: '92%', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', zIndex: 1000, elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  toastText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, flex: 1, marginLeft: 5 },
});