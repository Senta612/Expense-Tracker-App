import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [username, setUsername] = useState('Parthiv');
  
  // --- NEW: Custom UPI Apps List ---
  const [upiApps, setUpiApps] = useState(['GPay', 'PhonePe', 'Paytm']); 

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedExpenses = await AsyncStorage.getItem('expenses');
      const storedName = await AsyncStorage.getItem('username');
      const storedApps = await AsyncStorage.getItem('upiApps'); // Load Apps

      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
      if (storedName) setUsername(storedName);
      if (storedApps) setUpiApps(JSON.parse(storedApps));
    } catch (e) {
      console.log("Error loading", e);
    }
  };

  // --- NEW: Manage UPI Apps ---
  const addUpiApp = async (appName) => {
    if (!upiApps.includes(appName)) {
      const updated = [...upiApps, appName];
      setUpiApps(updated);
      await AsyncStorage.setItem('upiApps', JSON.stringify(updated));
    }
  };

  const removeUpiApp = async (appName) => {
    const updated = upiApps.filter(app => app !== appName);
    setUpiApps(updated);
    await AsyncStorage.setItem('upiApps', JSON.stringify(updated));
  };

  const addExpense = async (newExpense) => {
    const entry = { id: Date.now().toString(), ...newExpense };
    const updated = [entry, ...expenses];
    setExpenses(updated);
    await AsyncStorage.setItem('expenses', JSON.stringify(updated));
  };

  const deleteExpense = async (id) => {
    const updated = expenses.filter(item => item.id !== id);
    setExpenses(updated);
    await AsyncStorage.setItem('expenses', JSON.stringify(updated));
  };

  const updateExpense = async (id, updatedData) => {
    const newExpenses = expenses.map((item) => {
      if (item.id === id) return { ...item, ...updatedData };
      return item;
    });
    setExpenses(newExpenses);
    await AsyncStorage.setItem('expenses', JSON.stringify(newExpenses));
  };

  const updateUsername = async (name) => {
    setUsername(name);
    await AsyncStorage.setItem('username', name);
  };

  const clearAllData = async () => {
    setExpenses([]);
    await AsyncStorage.removeItem('expenses');
  };

  const getFilteredExpenses = (filterType) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return expenses.filter((item) => {
      const itemTime = new Date(item.date).getTime();
      if (filterType === 'Day') return itemTime >= todayStart;
      if (filterType === 'Week') return itemTime >= todayStart - (7 * 86400000);
      if (filterType === 'Month') {
        const d = new Date(item.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  return (
    <ExpenseContext.Provider value={{ 
      expenses, 
      username, 
      upiApps, // <--- Export
      addUpiApp, // <--- Export
      removeUpiApp, // <--- Export
      updateUsername, 
      clearAllData, 
      addExpense, 
      deleteExpense, 
      updateExpense, 
      getFilteredExpenses 
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => useContext(ExpenseContext);