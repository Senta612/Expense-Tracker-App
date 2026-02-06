import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import { Text, Button, Surface, IconButton, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';

export default function SettingsScreen({ navigation }) {
  const {
    username, updateUsername, clearAllData,
    currency, updateCurrency, 
    upiApps, addUpiApp, removeUpiApp,
    categories, addCategory, removeCategory,
    paymentModes, addPaymentMode, removePaymentMode
  } = useExpenses();

  const [nameInput, setNameInput] = useState(username);
  const [newAppInput, setNewAppInput] = useState('');
  const [newCatInput, setNewCatInput] = useState('');
  const [newModeInput, setNewModeInput] = useState('');

  const CURRENCY_OPTIONS = ['₹', '$', '€', '£', '¥', ];

  const handleSaveName = () => {
    updateUsername(nameInput);
    Alert.alert("Success", "Name updated!");
  };

  const handleAddApp = () => { if (newAppInput.trim().length > 0) { addUpiApp(newAppInput.trim()); setNewAppInput(''); } };
  const handleAddCat = () => { if (newCatInput.trim().length > 0) { addCategory(newCatInput.trim()); setNewCatInput(''); } };
  const handleAddMode = () => { if (newModeInput.trim().length > 0) { addPaymentMode(newModeInput.trim()); setNewModeInput(''); } };

  const handleReset = () => {
    Alert.alert("Reset App?", "This will delete ALL data.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { clearAllData(); Alert.alert("Reset Complete"); } }
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>

          {/* Profile Section */}
          <Text style={styles.sectionTitle}>Profile</Text>
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              style={styles.input}
              placeholder="Enter name"
            />
            <Button mode="contained" onPress={handleSaveName} buttonColor="#1A1A1A" textColor="#FFF" style={styles.saveBtn}>
              Save Name
            </Button>
          </Surface>

          {/* --- CURRENCY SECTION (Fixed Visibility) --- */}
          <Text style={styles.sectionTitle}>Currency</Text>
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.label}>Select Symbol</Text>
            <View style={styles.chipRow}>
              {CURRENCY_OPTIONS.map(symbol => (
                <Chip
                  key={symbol}
                  selected={currency === symbol}
                  onPress={() => updateCurrency(symbol)}
                  showSelectedCheck={false} // Clean look
                  // Logic: If selected, Black BG. If not, Light BG.
                  style={[
                    styles.chip, 
                    currency === symbol && { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' } 
                  ]}
                  // Logic: If selected, White Text. If not, Black Text.
                  textStyle={{
                    color: currency === symbol ? '#FFF' : '#1A1A1A', 
                    fontWeight: 'bold',
                    fontSize: 16
                  }}
                >
                  {symbol}
                </Chip>
              ))}
            </View>
          </Surface>

          {/* Categories (Fixed Visibility) */}
          <Text style={styles.sectionTitle}>Categories</Text>
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.label}>Manage Categories</Text>
            <View style={styles.addAppRow}>
              <TextInput value={newCatInput} onChangeText={setNewCatInput} style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Add new (e.g. Gym)" />
              <IconButton icon="plus-circle" iconColor="#1A1A1A" size={30} onPress={handleAddCat} />
            </View>
            <View style={styles.chipRow}>
              {categories.map(cat => (
                <Chip 
                  key={cat} 
                  onClose={() => removeCategory(cat)} 
                  style={styles.chip} 
                  // Force Black Text
                  textStyle={{ color: '#1A1A1A', fontSize: 13, fontWeight: '500' }}
                >
                  {cat}
                </Chip>
              ))}
            </View>
          </Surface>

          {/* Payment Modes (Fixed Visibility) */}
          <Text style={styles.sectionTitle}>Payment Modes</Text>
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.label}>Modes</Text>
            <View style={styles.addAppRow}>
              <TextInput value={newModeInput} onChangeText={setNewModeInput} style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Add new" />
              <IconButton icon="plus-circle" iconColor="#1A1A1A" size={30} onPress={handleAddMode} />
            </View>
            <View style={styles.chipRow}>
              {paymentModes.map(mode => (
                <Chip 
                  key={mode} 
                  onClose={() => removePaymentMode(mode)} 
                  style={styles.chip} 
                  // Force Black Text
                  textStyle={{ color: '#1A1A1A', fontSize: 13, fontWeight: '500' }}
                >
                  {mode}
                </Chip>
              ))}
            </View>
          </Surface>

          {/* UPI Apps (Fixed Visibility) */}
          <Text style={styles.sectionTitle}>UPI Options</Text>
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.label}>Manage UPI Apps</Text>
            <View style={styles.addAppRow}>
              <TextInput value={newAppInput} onChangeText={setNewAppInput} style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Add new" />
              <IconButton icon="plus-circle" iconColor="#1A1A1A" size={30} onPress={handleAddApp} />
            </View>
            <View style={styles.chipRow}>
              {upiApps.map(app => (
                <Chip 
                  key={app} 
                  onClose={() => removeUpiApp(app)} 
                  style={styles.chip} 
                  // Force Black Text
                  textStyle={{ color: '#1A1A1A', fontSize: 13, fontWeight: '500' }}
                >
                  {app}
                </Chip>
              ))}
            </View>
          </Surface>

          {/* Data Management */}
          <Text style={styles.sectionTitle}>Data</Text>
          <Surface style={styles.card} elevation={1}>
            <Button mode="outlined" onPress={handleReset} textColor="#FF5252" style={{ borderColor: '#FF5252' }}>Reset App</Button>
          </Surface>

          <View style={styles.footer}>
            <Text style={styles.version}>Expense Tracker v1.3</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, marginBottom: 20 },
  backBtn: { padding: 10 },
  backText: { fontSize: 24, color: '#333' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  content: { paddingHorizontal: 24 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 10, marginTop: 10, textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { fontSize: 16, borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 8, color: '#1A1A1A', marginBottom: 15 },
  saveBtn: { borderRadius: 12 },
  addAppRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#EEE' }, // Added border for better contrast
  footer: { alignItems: 'center', marginTop: 20 },
  version: { color: '#ccc', fontSize: 12 }
});