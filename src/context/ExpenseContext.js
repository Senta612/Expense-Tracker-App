import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  // --- 1. STATE VARIABLES ---
  const [expenses, setExpenses] = useState([]);
  const [username, setUsername] = useState('User'); // <--- RESTORED THIS!
  
  // Dynamic Lists
  const [categories, setCategories] = useState(['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Other']);
  const [paymentModes, setPaymentModes] = useState(['UPI', 'Cash', 'Card']);
  const [upiApps, setUpiApps] = useState(['GPay', 'PhonePe', 'Paytm']); 

  // --- 2. LOAD DATA ON STARTUP ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedExpenses = await AsyncStorage.getItem('expenses');
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));

      const storedName = await AsyncStorage.getItem('username'); // <--- LOAD NAME
      if (storedName) setUsername(storedName);

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

  // --- 3. ACTIONS ---

  // Username
  const updateUsername = async (name) => {
    setUsername(name);
    await AsyncStorage.setItem('username', name);
  };

  // Expenses
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

  // Categories
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

  // Payment Modes
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

  // UPI Apps
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

  // --- 4. FILTER FUNCTION (FIXED FOR TODAY) ---
  const getFilteredExpenses = (timeRange) => {
    if (!timeRange || timeRange === 'All') return expenses;
    
    const now = new Date();
    const cutoff = new Date(); 

    if (timeRange === 'Today' || timeRange === 'Day') {
        cutoff.setHours(0, 0, 0, 0); // Start of Today
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

  return (
    <ExpenseContext.Provider value={{ 
      expenses, 
      username, updateUsername, // <--- EXPORTED NOW
      addExpense, deleteExpense, editExpense, clearAllData,
      getFilteredExpenses, 
      categories, addCategory, removeCategory,
      paymentModes, addPaymentMode, removePaymentMode,
      upiApps, addUpiApp, removeUpiApp
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => useContext(ExpenseContext);