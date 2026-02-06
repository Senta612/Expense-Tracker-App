import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  // --- 1. THEME & COLORS ---
  const systemScheme = useColorScheme(); 
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  
  // Determine if Dark Mode is active
  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';

  // 🎨 PROFESSIONAL COLOR PALETTE
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

  // --- 2. CORE DATA STATE ---
  const [expenses, setExpenses] = useState([]);
  const [username, setUsername] = useState('User');
  const [currency, setCurrency] = useState('₹');
  const [budget, setBudget] = useState('0');

  // --- 3. UI STATE (Alerts & Updates) ---
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
      // Load Core Data
      const storedExpenses = await AsyncStorage.getItem('expenses');
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));

      const storedName = await AsyncStorage.getItem('username');
      if (storedName) setUsername(storedName);

      const storedCurrency = await AsyncStorage.getItem('currency');
      if (storedCurrency) setCurrency(storedCurrency);

      const storedBudget = await AsyncStorage.getItem('budget');
      if (storedBudget) setBudget(storedBudget);

      // Load Settings
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

  // --- 6. UPDATE CHECKER LOGIC 🚀 ---
  const CURRENT_APP_VERSION = "1.0.0"; // <--- UPDATE THIS BEFORE RELEASING NEW APK
  // TODO: Replace with your actual GitHub Raw URL
  const UPDATE_API_URL = "https://raw.githubusercontent.com/YOUR_GITHUB_USER/YOUR_REPO/main/version.json"; 

  const checkForUpdate = async () => {
    try {
      // Skip check if no URL is set (development mode)
      if (UPDATE_API_URL.includes("YOUR_GITHUB_USER")) return;

      const response = await fetch(UPDATE_API_URL);
      const data = await response.json();

      if (data.version !== CURRENT_APP_VERSION) {
        setUpdateAvailable(data);
      }
    } catch (e) {
      console.log("Update check failed (Offline or Invalid URL)", e);
    }
  };

  // --- 7. ACTION FUNCTIONS ---

  // Theme
  const updateTheme = async (mode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem('themeMode', mode);
  };

  // Custom Alert
  const showAlert = (title, msg, onConfirm = null) => {
    setAlertConfig({ visible: true, title, msg, onConfirm });
  };
  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  // Core Data Setters
  const updateBudget = async (amount) => { setBudget(amount); await AsyncStorage.setItem('budget', amount); };
  const updateCurrency = async (symbol) => { setCurrency(symbol); await AsyncStorage.setItem('currency', symbol); };
  const updateUsername = async (name) => { setUsername(name); await AsyncStorage.setItem('username', name); };

  // Expense CRUD
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
    // Optional: Reset other settings if needed, but usually we keep profile info
  };

  // List Management (Categories, Modes, Apps)
  const addCategory = async (cat) => { if(!categories.includes(cat)) { const u=[...categories, cat]; setCategories(u); await AsyncStorage.setItem('categories', JSON.stringify(u)); }};
  const removeCategory = async (cat) => { const u=categories.filter(c=>c!==cat); setCategories(u); await AsyncStorage.setItem('categories', JSON.stringify(u)); };
  
  const addPaymentMode = async (m) => { if(!paymentModes.includes(m)) { const u=[...paymentModes, m]; setPaymentModes(u); await AsyncStorage.setItem('paymentModes', JSON.stringify(u)); }};
  const removePaymentMode = async (m) => { const u=paymentModes.filter(x=>x!==m); setPaymentModes(u); await AsyncStorage.setItem('paymentModes', JSON.stringify(u)); };
  
  const addUpiApp = async (a) => { if(!upiApps.includes(a)) { const u=[...upiApps, a]; setUpiApps(u); await AsyncStorage.setItem('upiApps', JSON.stringify(u)); }};
  const removeUpiApp = async (a) => { const u=upiApps.filter(x=>x!==a); setUpiApps(u); await AsyncStorage.setItem('upiApps', JSON.stringify(u)); };

  // Helper: Filter Logic
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

  // Helper: Total Spent
  const getTotalSpent = () => {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
  };

  return (
    <ExpenseContext.Provider value={{ 
      // Data
      expenses, username, currency, budget,
      categories, paymentModes, upiApps,

      // Theme
      themeMode, isDark, colors, updateTheme,

      // UI (Alerts & Updates)
      alertConfig, showAlert, closeAlert,
      updateAvailable, setUpdateAvailable,

      // Actions
      updateUsername, updateCurrency, updateBudget,
      addExpense, deleteExpense, editExpense, clearAllData,
      addCategory, removeCategory,
      addPaymentMode, removePaymentMode,
      addUpiApp, removeUpiApp,

      // Helpers
      getFilteredExpenses, getTotalSpent
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => useContext(ExpenseContext);