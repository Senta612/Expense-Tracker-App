import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  // --- 1. THEME & COLORS ---
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'

  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';

  const colors = isDark ? {
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSec: '#AAAAAA',
    primary: '#4F8EF7',
    accent: '#BB86FC',
    success: '#00C853',
    error: '#CF6679',
    border: '#333333',
    inputBg: '#2C2C2C',
    chip: '#333333',
    icon: '#FFFFFF'
  } : {
    background: '#F5F7FA',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSec: '#666666',
    primary: '#1A1A1A',
    accent: '#6200EE',
    success: '#00C853',
    error: '#FF5252',
    border: '#EEE',
    inputBg: '#FFFFFF',
    chip: '#F3F4F6',
    icon: '#1A1A1A'
  };

  // --- 2. CORE DATA STATE ---
  const [expenses, setExpenses] = useState([]);
  const [username, setUsername] = useState('User');
  const [currency, setCurrency] = useState('₹');
  const [budget, setBudget] = useState('0'); // Acts as "Opening Balance"

  // --- 3. UI STATE ---
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', msg: '', onConfirm: null });
  const [updateAvailable, setUpdateAvailable] = useState(null);

  // --- 4. LISTS STATE ---
  const [categories, setCategories] = useState(['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Other']);
  const [paymentModes, setPaymentModes] = useState(['UPI', 'Cash', 'Card']);
  const [upiApps, setUpiApps] = useState(['GPay', 'PhonePe', 'Paytm']);

  // --- 5. INITIAL LOAD ---
  useEffect(() => {
    loadData();
    checkForUpdate();
  }, []);

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

      const storedTheme = await AsyncStorage.getItem('themeMode');
      if (storedTheme) setThemeMode(storedTheme);

      const storedCats = await AsyncStorage.getItem('categories');
      if (storedCats) setCategories(JSON.parse(storedCats));

      const storedModes = await AsyncStorage.getItem('paymentModes');
      if (storedModes) setPaymentModes(JSON.parse(storedModes));

      const storedUpi = await AsyncStorage.getItem('upiApps');
      if (storedUpi) setUpiApps(JSON.parse(storedUpi));

    } catch (e) {
      console.error("Failed to load data", e);
    }
  };

  // --- 6. UPDATE LOGIC ---
  const CURRENT_APP_VERSION = "1.0.0"; 
  const UPDATE_API_URL = "https://raw.githubusercontent.com/YOUR_GITHUB_USER/YOUR_REPO/main/version.json";

  const checkForUpdate = async () => {
    try {
      if (UPDATE_API_URL.includes("YOUR_GITHUB_USER")) return;
      const response = await fetch(UPDATE_API_URL);
      const data = await response.json();
      if (data.version !== CURRENT_APP_VERSION) setUpdateAvailable(data);
    } catch (e) {
      console.log("Update check failed", e);
    }
  };

  // --- 7. ACTIONS (CRUD) ---

  // Add Expense or Income
  const addExpense = async (expense) => {
    const newExpense = { 
        ...expense, 
        // Ensure type exists (default to 'expense' for old data compatibility)
        type: expense.type || 'expense' 
    };
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    await AsyncStorage.setItem('expenses', JSON.stringify(updated));
  };

  const deleteExpense = async (id) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    await AsyncStorage.setItem('expenses', JSON.stringify(updated));
  };

  const updateExpense = async (updatedExpense) => {
    const updated = expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e);
    setExpenses(updated);
    await AsyncStorage.setItem('expenses', JSON.stringify(updated));
  };

  const clearAllData = async () => {
    setExpenses([]);
    await AsyncStorage.removeItem('expenses');
  };

  // --- 8. SETTINGS ACTIONS ---
  const updateTheme = async (mode) => { setThemeMode(mode); await AsyncStorage.setItem('themeMode', mode); };
  const updateBudget = async (amount) => { setBudget(amount); await AsyncStorage.setItem('budget', amount); };
  const updateCurrency = async (symbol) => { setCurrency(symbol); await AsyncStorage.setItem('currency', symbol); };
  const updateUsername = async (name) => { setUsername(name); await AsyncStorage.setItem('username', name); };

  // --- 9. LIST MANAGEMENT ---
  const addCategory = async (cat) => { if (!categories.includes(cat)) { const u = [...categories, cat]; setCategories(u); await AsyncStorage.setItem('categories', JSON.stringify(u)); } };
  const removeCategory = async (cat) => { const u = categories.filter(c => c !== cat); setCategories(u); await AsyncStorage.setItem('categories', JSON.stringify(u)); };
  const addPaymentMode = async (m) => { if (!paymentModes.includes(m)) { const u = [...paymentModes, m]; setPaymentModes(u); await AsyncStorage.setItem('paymentModes', JSON.stringify(u)); } };
  const removePaymentMode = async (m) => { const u = paymentModes.filter(x => x !== m); setPaymentModes(u); await AsyncStorage.setItem('paymentModes', JSON.stringify(u)); };
  const addUpiApp = async (a) => { if (!upiApps.includes(a)) { const u = [...upiApps, a]; setUpiApps(u); await AsyncStorage.setItem('upiApps', JSON.stringify(u)); } };
  const removeUpiApp = async (a) => { const u = upiApps.filter(x => x !== a); setUpiApps(u); await AsyncStorage.setItem('upiApps', JSON.stringify(u)); };

  // --- 10. ALERT UTILS ---
  const showAlert = (title, msg, onConfirm = null) => setAlertConfig({ visible: true, title, msg, onConfirm });
  const closeAlert = () => setAlertConfig({ ...alertConfig, visible: false });

  // --- 11. HELPERS & MATH ---

  // Filter Logic (Time Ranges)
  const getFilteredExpenses = (timeRange) => {
    if (!timeRange || timeRange === 'All') return expenses;
    const now = new Date();
    const cutoff = new Date();
    if (timeRange === 'Today' || timeRange === 'Day') cutoff.setHours(0, 0, 0, 0);
    else if (timeRange === 'Week' || timeRange === '7 Days') { cutoff.setDate(now.getDate() - 7); cutoff.setHours(0, 0, 0, 0); }
    else if (timeRange === 'Month' || timeRange === '30 Days') { cutoff.setMonth(now.getMonth() - 1); cutoff.setHours(0, 0, 0, 0); }
    else if (timeRange === 'Year') { cutoff.setFullYear(now.getFullYear() - 1); cutoff.setHours(0, 0, 0, 0); }
    
    // Filter by date AND exclude Income entries from the expense list view if desired
    // (Usually you want to see everything in "All", but maybe filter out income for "Spending" charts)
    return expenses.filter(e => new Date(e.date) >= cutoff);
  };

  // ✅ NEW WALLET LOGIC
  const getBalanceData = () => {
    // 1. Calculate Total Expenses (Only items with type 'expense')
    const totalSpent = expenses
        .filter(item => item.type === 'expense' || !item.type) // !type covers old data
        .reduce((sum, item) => sum + parseFloat(item.amount), 0);

    // 2. Calculate Total Income (Only items with type 'income')
    const totalIncome = expenses
        .filter(item => item.type === 'income')
        .reduce((sum, item) => sum + parseFloat(item.amount), 0);

    // 3. Opening Balance (Set in Settings)
    const initialBudget = parseFloat(budget) || 0;

    // 4. Final Available Balance
    const availableBalance = (initialBudget + totalIncome) - totalSpent;

    return { totalSpent, totalIncome, availableBalance };
  };

  // Legacy helper for simple total (Expenses only)
  const getTotalSpent = () => {
    return expenses
        .filter(item => item.type === 'expense' || !item.type)
        .reduce((sum, item) => sum + parseFloat(item.amount), 0);
  };

  return (
    <ExpenseContext.Provider value={{
      // State
      expenses, username, currency, budget,
      categories, paymentModes, upiApps,
      themeMode, isDark, colors,
      alertConfig, showAlert, closeAlert,
      updateAvailable, setUpdateAvailable,

      // Actions
      updateUsername, updateCurrency, updateBudget, updateTheme,
      addExpense, deleteExpense, updateExpense, clearAllData,
      addCategory, removeCategory, addPaymentMode, removePaymentMode, addUpiApp, removeUpiApp,

      // Helpers
      getFilteredExpenses, getTotalSpent, getBalanceData
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => useContext(ExpenseContext);