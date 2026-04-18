// src/screens/AddExpenseScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, KeyboardAvoidingView, Dimensions, LayoutAnimation, UIManager } from 'react-native';
import { Text, IconButton, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';

import ToastNotification from '../components/ToastNotification';
import ExpenseForm from '../components/ExpenseForm';
import IncomeForm from '../components/IncomeForm';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  try { UIManager.setLayoutAnimationEnabledExperimental(true); } catch (e) { /* no-op on New Architecture */ }
}


export default function AddExpenseScreen({ navigation, route }) {
  const { addExpense, addMultipleExpenses, editExpense, categories, paymentModes, upiApps, currency, getBalanceData, colors } = useExpenses();

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
      // ✨ FIX: Use the new bulk add function for Arrays!
      if (Array.isArray(payload)) {
        addMultipleExpenses(payload);
      } else {
        if (isEditing) editExpense(payload);
        else addExpense(payload);
      }

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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <IconButton icon="close" size={24} iconColor={colors.text} style={{ margin: 0 }} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditing ? 'Edit' : 'New'} Transaction</Text>
          <View style={{ width: 40 }} />
        </View>

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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: 5 },
  iconBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  toggleContainer: { marginHorizontal: 40, marginTop: 15 },
});