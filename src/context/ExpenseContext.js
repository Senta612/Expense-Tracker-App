import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native'; // Detect System Theme
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  // --- 1. THEME & COLORS ---
  const systemScheme = useColorScheme(); 
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  
  // The Active Mode (Actual visual look)
  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';

  // PROFESSIONAL COLOR PALETTE 🎨
  const colors = isDark ? {
    // DARK MODE
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSec: '#AAAAAA',
    primary: '#4F8EF7', // Nice Blue
    accent: '#BB86FC',
    success: '#00C853',
    error: '#CF6679',
    border: '#333333',
    inputBg: '#2C2C2C',
    chip: '#333333',
    icon: '#FFFFFF'
  } : {
    // LIGHT MODE
    background: '#F5F7FA',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSec: '#666666',
    primary: '#1A1A1A', // Sharp Black
    accent: '#6200EE',
    success: '#00C853',
    error: '#FF5252',
    border: '#EEE',
    inputBg: '#FFFFFF',
    chip: '#F3F4F6',
    icon: '#1A1A1A'
  };

  // --- 2. DATA STATE ---
  const [expenses, setExpenses] = useState([]);
  const [username, setUsername] = useState('User');
  const [currency, setCurrency] = useState('₹');
  const [budget, setBudget] = useState('0');
  
  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', msg: '', onConfirm: null });

  // Lists
  const [categories, setCategories] = useState(['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Other']);
  const [paymentModes, setPaymentModes] = useState(['UPI', 'Cash', 'Card']);
  const [upiApps, setUpiApps] = useState(['GPay', 'PhonePe', 'Paytm']); 

  // --- 3. LOAD DATA ---
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const storedExpenses = await AsyncStorage.getItem('expenses');
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));

      const storedName = await AsyncStorage.getItem('username');
      if (storedName) setUsername(storedName);

      const storedCurrency = await AsyncStorage.getItem('currency');
      if (storedCurrency) setCurrency(storedCurrency);

      const storedBudget = await AsyncStorage.getItem('budget');
      if (storedBudget) setBudget(storedBudget);

      const storedTheme = await AsyncStorage.getItem('themeMode'); // Load Theme
      if (storedTheme) setThemeMode(storedTheme);

      const storedCats = await AsyncStorage.getItem('categories');
      if (storedCats) setCategories(JSON.parse(storedCats));
      
      const storedModes = await AsyncStorage.getItem('paymentModes');
      if (storedModes) setPaymentModes(JSON.parse(storedModes));
      
      const storedUpi = await AsyncStorage.getItem('upiApps');
      if (storedUpi) setUpiApps(JSON.parse(storedUpi));

    } catch (e) { console.error("Failed to load data", e); }
  };

  // --- 4. ACTIONS ---
  
  // Theme Action
  const updateTheme = async (mode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem('themeMode', mode);
  };

  // Alert Action (Replaces Alert.alert)
  const showAlert = (title, msg, onConfirm = null) => {
    setAlertConfig({ visible: true, title, msg, onConfirm });
  };
  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  // ... (Existing Actions: updateBudget, updateCurrency, etc. - KEPT SAME)
  const updateBudget = async (amount) => { setBudget(amount); await AsyncStorage.setItem('budget', amount); };
  const updateCurrency = async (symbol) => { setCurrency(symbol); await AsyncStorage.setItem('currency', symbol); };
  const updateUsername = async (name) => { setUsername(name); await AsyncStorage.setItem('username', name); };
  
  const addExpense = async (newExpense) => {
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    await AsyncStorage.setItem('expenses', JSON.stringify(updated));
  };
  const deleteExpense = async (id) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    await AsyncStorage.setItem('expenses', JSON.stringify(updated));
  };
  const editExpense = async (updatedExpense) => {
    const updated = expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e);
    setExpenses(updated);
    await AsyncStorage.setItem('expenses', JSON.stringify(updated));
  };
  const clearAllData = async () => {
    setExpenses([]);
    await AsyncStorage.removeItem('expenses');
  };
  
  const addCategory = async (cat) => { if(!categories.includes(cat)) { const u=[...categories, cat]; setCategories(u); await AsyncStorage.setItem('categories', JSON.stringify(u)); }};
  const removeCategory = async (cat) => { const u=categories.filter(c=>c!==cat); setCategories(u); await AsyncStorage.setItem('categories', JSON.stringify(u)); };
  
  const addPaymentMode = async (m) => { if(!paymentModes.includes(m)) { const u=[...paymentModes, m]; setPaymentModes(u); await AsyncStorage.setItem('paymentModes', JSON.stringify(u)); }};
  const removePaymentMode = async (m) => { const u=paymentModes.filter(x=>x!==m); setPaymentModes(u); await AsyncStorage.setItem('paymentModes', JSON.stringify(u)); };
  
  const addUpiApp = async (a) => { if(!upiApps.includes(a)) { const u=[...upiApps, a]; setUpiApps(u); await AsyncStorage.setItem('upiApps', JSON.stringify(u)); }};
  const removeUpiApp = async (a) => { const u=upiApps.filter(x=>x!==a); setUpiApps(u); await AsyncStorage.setItem('upiApps', JSON.stringify(u)); };

  const getFilteredExpenses = (timeRange) => {
    if (!timeRange || timeRange === 'All') return expenses;
    const now = new Date();
    const cutoff = new Date(); 
    if (timeRange === 'Today' || timeRange === 'Day') cutoff.setHours(0, 0, 0, 0); 
    else if (timeRange === 'Week' || timeRange === '7 Days') { cutoff.setDate(now.getDate() - 7); cutoff.setHours(0, 0, 0, 0); }
    else if (timeRange === 'Month' || timeRange === '30 Days') { cutoff.setMonth(now.getMonth() - 1); cutoff.setHours(0, 0, 0, 0); }
    else if (timeRange === 'Year') { cutoff.setFullYear(now.getFullYear() - 1); cutoff.setHours(0, 0, 0, 0); }
    return expenses.filter(e => new Date(e.date) >= cutoff);
  };

  const getTotalSpent = () => expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <ExpenseContext.Provider value={{ 
      expenses, username, currency, budget, 
      themeMode, isDark, colors, updateTheme, // <--- NEW THEME EXPORTS
      alertConfig, showAlert, closeAlert, // <--- NEW ALERT EXPORTS
      updateUsername, updateCurrency, updateBudget,
      addExpense, deleteExpense, editExpense, clearAllData,
      getFilteredExpenses, getTotalSpent,
      categories, addCategory, removeCategory,
      paymentModes, addPaymentMode, removePaymentMode,
      upiApps, addUpiApp, removeUpiApp
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => useContext(ExpenseContext);