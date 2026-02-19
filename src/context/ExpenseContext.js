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
  
  // BUDGET STATE
  const [budget, setBudget] = useState('0'); 
  const [budgetPeriod, setBudgetPeriod] = useState('Monthly'); 

  // ✨ NEW: FIRST LAUNCH STATE
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

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
      // ✨ Check if it is the first time opening the app
      const hasSeenTutorial = await AsyncStorage.getItem('hasSeenTutorial');
      if (!hasSeenTutorial) setIsFirstLaunch(true);

      const storedExpenses = await AsyncStorage.getItem('expenses');
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));

      const storedName = await AsyncStorage.getItem('username');
      if (storedName) setUsername(storedName);

      const storedCurrency = await AsyncStorage.getItem('currency');
      if (storedCurrency) setCurrency(storedCurrency);

      const storedBudget = await AsyncStorage.getItem('budget');
      if (storedBudget) setBudget(storedBudget);

      const storedPeriod = await AsyncStorage.getItem('budgetPeriod');
      if (storedPeriod) setBudgetPeriod(storedPeriod);

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

  // ✨ Function to complete tutorial
  const completeTutorial = async () => {
    setIsFirstLaunch(false);
    await AsyncStorage.setItem('hasSeenTutorial', 'true');
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
  const addExpense = async (newExpense) => {
    const expenseWithType = { 
        ...newExpense, 
        type: newExpense.type || 'expense' 
    };
    const updated = [expenseWithType, ...expenses];
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
    // Reset tutorial on data clear so they see it again if they reset the app
    setIsFirstLaunch(true); 
    await AsyncStorage.removeItem('hasSeenTutorial');
  };

  // --- 8. SETTINGS ACTIONS ---
  const updateTheme = async (mode) => { setThemeMode(mode); await AsyncStorage.setItem('themeMode', mode); };
  const updateCurrency = async (symbol) => { setCurrency(symbol); await AsyncStorage.setItem('currency', symbol); };
  const updateUsername = async (name) => { setUsername(name); await AsyncStorage.setItem('username', name); };
  const updateBudget = async (amount) => { setBudget(amount); await AsyncStorage.setItem('budget', amount); };
  
  const updateBudgetConfig = async (amount, period) => { 
    setBudget(amount); 
    setBudgetPeriod(period);
    await AsyncStorage.setItem('budget', amount); 
    await AsyncStorage.setItem('budgetPeriod', period); 
  };

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

  const getBalanceData = () => {
    const now = new Date();
    let cutoff = new Date();

    if (budgetPeriod === 'Weekly') {
        cutoff.setDate(now.getDate() - now.getDay()); 
        cutoff.setHours(0, 0, 0, 0);
    } else if (budgetPeriod === 'Monthly') {
        cutoff = new Date(now.getFullYear(), now.getMonth(), 1); 
    } else if (budgetPeriod === 'Yearly') {
        cutoff = new Date(now.getFullYear(), 0, 1); 
    } else {
        cutoff = new Date(0); 
    }

    const currentPeriodItems = expenses.filter(e => new Date(e.date) >= cutoff);

    const spentThisPeriod = currentPeriodItems
        .filter(item => item.type === 'expense' || !item.type)
        .reduce((sum, item) => sum + parseFloat(item.amount), 0);

    const incomeThisPeriod = currentPeriodItems
        .filter(item => item.type === 'income')
        .reduce((sum, item) => sum + parseFloat(item.amount), 0);

    const baseBudget = parseFloat(budget) || 0;
    const availableBalance = (baseBudget + incomeThisPeriod) - spentThisPeriod;

    return { spentThisPeriod, incomeThisPeriod, availableBalance, budgetPeriod };
  };

  const getTotalSpent = () => {
    return expenses
        .filter(item => item.type === 'expense' || !item.type)
        .reduce((sum, item) => sum + parseFloat(item.amount), 0);
  };

  return (
    <ExpenseContext.Provider value={{
      expenses, username, currency, budget, budgetPeriod,
      categories, paymentModes, upiApps,
      themeMode, isDark, colors,
      alertConfig, showAlert, closeAlert,
      updateAvailable, setUpdateAvailable,
      isFirstLaunch, // ✨ Exported

      updateUsername, updateCurrency, updateBudget, updateBudgetConfig, updateTheme,
      addExpense, deleteExpense, editExpense, clearAllData,
      addCategory, removeCategory, addPaymentMode, removePaymentMode, addUpiApp, removeUpiApp, completeTutorial, // ✨ Exported

      getFilteredExpenses, getTotalSpent, getBalanceData
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => useContext(ExpenseContext);