import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Button, Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';

export default function AddExpenseScreen({ navigation, route }) {
  // 1. Get Dynamic Lists from Context
  const { addExpense, editExpense, categories, paymentModes, upiApps } = useExpenses();
  
  const existingExpense = route.params?.expense;
  const isEditing = !!existingExpense;

  // 2. Set Default State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  
  // Default to first item in list or 'Food' if list is empty
  const [category, setCategory] = useState(categories && categories.length > 0 ? categories[0] : 'Food');
  const [paymentMode, setPaymentMode] = useState(paymentModes && paymentModes.length > 0 ? paymentModes[0] : 'UPI');
  
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [paymentApp, setPaymentApp] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  // 3. Load Data if Editing
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
    if (!name || !amount) {
      Alert.alert("Missing Info", "Please enter details.");
      return;
    }

    const payload = {
      id: existingExpense ? existingExpense.id : Date.now().toString(), // Ensure ID exists
      name,
      amount: parseFloat(amount),
      category,
      description,
      date: date.toISOString(),
      paymentMode,
      paymentApp: paymentMode === 'UPI' ? paymentApp : null,
    };

    if (isEditing) {
      editExpense(payload);
    } else {
      addExpense(payload);
    }
    navigation.goBack();
  };

  const scrollViewRef = useRef();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
        >
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditing ? 'Edit' : 'Add'} Expense</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Amount Section */}
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

          {/* Form Section */}
          <View style={styles.formSection}>

            {/* Title Input */}
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.simpleInput}
              placeholder="e.g. Starbucks"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />

            {/* Payment Method (Dynamic) */}
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.chipContainer}>
              {paymentModes.map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => { setPaymentMode(mode); setPaymentApp(null); }}
                  style={[styles.chip, paymentMode === mode ? styles.activeChip : styles.inactiveChip]}
                >
                  <Text style={[styles.chipText, paymentMode === mode ? styles.activeChipText : styles.inactiveChipText]}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* UPI App Selection (Optional - Only if upiApps exists) */}
            {paymentMode === 'UPI' && upiApps && upiApps.length > 0 && (
              <View style={styles.subOptionContainer}>
                <View style={styles.chipContainer}>
                  {upiApps.map((app) => (
                    <TouchableOpacity
                      key={app}
                      onPress={() => setPaymentApp(app === paymentApp ? null : app)}
                      style={[styles.miniChip, paymentApp === app ? styles.activeMiniChip : styles.inactiveMiniChip]}
                    >
                      <Text style={[styles.miniChipText, paymentApp === app ? styles.activeMiniChipText : styles.inactiveMiniChipText]}>{app}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Category (Dynamic) */}
            <Text style={styles.label}>Category</Text>
            <View style={styles.chipContainer}>
              {categories.map((cat) => (
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

            {/* Date Picker */}
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateRow}>
              <Text style={styles.dateText}>{date.toDateString()}</Text>
              <Text style={styles.calendarIcon}>📅</Text>
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker 
                value={date} 
                mode="date" 
                display="default" 
                onChange={(e, d) => { setShowPicker(false); if (d) setDate(d); }} 
              />
            )}

            {/* Description */}
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.simpleInput, { height: 60, textAlignVertical: 'top' }]}
              placeholder="Add notes..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              onFocus={() => setTimeout(() => scrollViewRef.current.scrollToEnd({ animated: true }), 100)}
            />

            {/* SAVE BUTTON */}
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveBtn}
              textColor="#FFF"
              labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
            >
              Save
            </Button>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 5 },
  backBtn: { padding: 10 },
  backText: { fontSize: 22, color: '#333' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#333' },

  amountContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 5, marginBottom: 15 },
  currencySymbol: { fontSize: 32, fontWeight: 'bold', color: '#1A1A1A', marginRight: 5 },
  amountInput: { fontSize: 32, fontWeight: 'bold', color: '#1A1A1A', minWidth: 80, textAlign: 'center' },

  formSection: {
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    flex: 1, 
  },

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

  saveBtn: {
    marginTop: 'auto',
    paddingVertical: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    elevation: 0,
    marginBottom: 10
  } 
});