import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  // --- STATE ---
  const [expenses, setExpenses] = useState([]);
  const [username, setUsername] = useState('User');
  const [currency, setCurrency] = useState('₹');
  const [budget, setBudget] = useState('0'); // <--- NEW: Budget Limit

  const [categories, setCategories] = useState(['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Other']);
  const [paymentModes, setPaymentModes] = useState(['UPI', 'Cash', 'Card']);
  const [upiApps, setUpiApps] = useState(['GPay', 'PhonePe', 'Paytm']); 

  // --- LOAD DATA ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedExpenses = await AsyncStorage.getItem('expenses');
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));

      const storedName = await AsyncStorage.getItem('username');
      if (storedName) setUsername(storedName);

      const storedCurrency = await AsyncStorage.getItem('currency');
      if (storedCurrency) setCurrency(storedCurrency);

      const storedBudget = await AsyncStorage.getItem('budget'); // <--- LOAD BUDGET
      if (storedBudget) setBudget(storedBudget);

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

  // --- ACTIONS ---

  const updateBudget = async (amount) => { // <--- NEW ACTION
    setBudget(amount);
    await AsyncStorage.setItem('budget', amount);
  };

  const updateCurrency = async (symbol) => {
    setCurrency(symbol);
    await AsyncStorage.setItem('currency', symbol);
  };

  const updateUsername = async (name) => {
    setUsername(name);
    await AsyncStorage.setItem('username', name);
  };

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

  const addCategory = async (cat) => {
    if (categories.includes(cat)) return;
    const updated = [...categories, cat];
    setCategories(updated);
    await AsyncStorage.setItem('categories', JSON.stringify(updated));
  };
  const removeCategory = async (cat) => {
    const updated = categories.filter(c => c !== cat);
    setCategories(updated);
    await AsyncStorage.setItem('categories', JSON.stringify(updated));
  };
  const addPaymentMode = async (mode) => {
    if (paymentModes.includes(mode)) return;
    const updated = [...paymentModes, mode];
    setPaymentModes(updated);
    await AsyncStorage.setItem('paymentModes', JSON.stringify(updated));
  };
  const removePaymentMode = async (mode) => {
    const updated = paymentModes.filter(m => m !== mode);
    setPaymentModes(updated);
    await AsyncStorage.setItem('paymentModes', JSON.stringify(updated));
  };
  const addUpiApp = async (app) => {
    if (upiApps.includes(app)) return;
    const updated = [...upiApps, app];
    setUpiApps(updated);
    await AsyncStorage.setItem('upiApps', JSON.stringify(updated));
  };
  const removeUpiApp = async (app) => {
    const updated = upiApps.filter(a => a !== app);
    setUpiApps(updated);
    await AsyncStorage.setItem('upiApps', JSON.stringify(updated));
  };

  const getFilteredExpenses = (timeRange) => {
    if (!timeRange || timeRange === 'All') return expenses;
    const now = new Date();
    const cutoff = new Date(); 
    if (timeRange === 'Today' || timeRange === 'Day') {
        cutoff.setHours(0, 0, 0, 0); 
    } else if (timeRange === 'Week' || timeRange === '7 Days') {
        cutoff.setDate(now.getDate() - 7);
        cutoff.setHours(0, 0, 0, 0); 
    } else if (timeRange === 'Month' || timeRange === '30 Days') {
        cutoff.setMonth(now.getMonth() - 1);
        cutoff.setHours(0, 0, 0, 0);
    } else if (timeRange === 'Year') {
        cutoff.setFullYear(now.getFullYear() - 1);
        cutoff.setHours(0, 0, 0, 0);
    }
    return expenses.filter(e => new Date(e.date) >= cutoff);
  };

  // Helper: Calculate Total Spent (Global)
  const getTotalSpent = () => {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
  };

  return (
    <ExpenseContext.Provider value={{ 
      expenses, 
      username, updateUsername, 
      currency, updateCurrency,
      budget, updateBudget, // <--- NEW EXPORT
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