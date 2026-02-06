import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Text, Button, Surface, IconButton, Chip, Menu, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';

export default function SettingsScreen({ navigation }) {
  const {
    username, updateUsername, clearAllData,
    currency, updateCurrency, 
    upiApps, addUpiApp, removeUpiApp,
    categories, addCategory, removeCategory,
    paymentModes, addPaymentMode, removePaymentMode,
    colors, showAlert, updateTheme, themeMode // <--- NEW IMPORTS
  } = useExpenses();

  const [nameInput, setNameInput] = useState(username);
  const [newAppInput, setNewAppInput] = useState('');
  const [newCatInput, setNewCatInput] = useState('');
  const [newModeInput, setNewModeInput] = useState('');
  
  // Theme Menu State
  const [visibleMenu, setVisibleMenu] = useState(false);
  const openMenu = () => setVisibleMenu(true);
  const closeMenu = () => setVisibleMenu(false);

  const CURRENCY_OPTIONS = ['₹', '$', '€', '£', '¥'];

  const handleSaveName = () => { updateUsername(nameInput); showAlert("Success", "Name updated successfully!"); };
  const handleAddApp = () => { if (newAppInput.trim().length > 0) { addUpiApp(newAppInput.trim()); setNewAppInput(''); } };
  const handleAddCat = () => { if (newCatInput.trim().length > 0) { addCategory(newCatInput.trim()); setNewCatInput(''); } };
  const handleAddMode = () => { if (newModeInput.trim().length > 0) { addPaymentMode(newModeInput.trim()); setNewModeInput(''); } };

  // Use Custom Alert for Reset
  const handleReset = () => {
    showAlert("Reset App Data?", "This will permanently delete all your expenses and settings. This cannot be undone.", () => {
        clearAllData();
    });
  };

  const SectionHeader = ({ icon, title }) => (
    <View style={styles.sectionHeaderRow}>
        <IconButton icon={icon} size={20} iconColor={colors.textSec} style={{margin:0, marginRight: 5}} />
        <Text style={[styles.sectionTitle, { color: colors.textSec }]}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Header with Theme Menu */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <IconButton icon="arrow-left" size={26} iconColor={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          
          {/* THEME SWITCHER */}
          <Menu
            visible={visibleMenu}
            onDismiss={closeMenu}
            anchor={<IconButton icon="brightness-6" iconColor={colors.text} size={24} onPress={openMenu} />}
            contentStyle={{ backgroundColor: colors.surface }}
          >
            <Menu.Item onPress={() => { updateTheme('light'); closeMenu(); }} title="Light Mode" titleStyle={{ color: colors.text }} leadingIcon="white-balance-sunny" />
            <Menu.Item onPress={() => { updateTheme('dark'); closeMenu(); }} title="Dark Mode" titleStyle={{ color: colors.text }} leadingIcon="moon-waning-crescent" />
            <Divider />
            <Menu.Item onPress={() => { updateTheme('system'); closeMenu(); }} title="System Default" titleStyle={{ color: colors.text }} leadingIcon="cellphone-cog" />
          </Menu>
        </View>

        <View style={styles.content}>

          {/* Profile Section */}
          <SectionHeader icon="account-circle-outline" title="Profile" />
          <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={1}>
            <Text style={[styles.label, { color: colors.text }]}>Your Name</Text>
            <TextInput 
                value={nameInput} 
                onChangeText={setNameInput} 
                style={[styles.input, { color: colors.text, borderColor: colors.border }]} 
                placeholder="Enter name"
                placeholderTextColor={colors.textSec}
            />
            <Button mode="contained" onPress={handleSaveName} buttonColor={colors.primary} textColor="#FFF" style={styles.saveBtn}>Save Name</Button>
          </Surface>

          {/* Currency Section */}
          <SectionHeader icon="currency-usd" title="Currency" />
          <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={1}>
            <Text style={[styles.label, { color: colors.text }]}>Select Symbol</Text>
            <View style={styles.chipRow}>
              {CURRENCY_OPTIONS.map(symbol => (
                <Chip
                  key={symbol}
                  selected={currency === symbol}
                  onPress={() => updateCurrency(symbol)}
                  showSelectedCheck={false} 
                  style={[ styles.chip, { backgroundColor: currency === symbol ? colors.primary : colors.chip, borderColor: colors.border } ]}
                  textStyle={{ color: currency === symbol ? '#FFF' : colors.text, fontWeight: 'bold', fontSize: 16 }}
                >
                  {symbol}
                </Chip>
              ))}
            </View>
          </Surface>

          {/* Categories */}
          <SectionHeader icon="shape-outline" title="Categories" />
          <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={1}>
            <View style={styles.addAppRow}>
              <TextInput value={newCatInput} onChangeText={setNewCatInput} style={[styles.input, { flex: 1, marginBottom: 0, color: colors.text, borderColor: colors.border }]} placeholder="Add new (e.g. Gym)" placeholderTextColor={colors.textSec} />
              <IconButton icon="plus-circle" iconColor={colors.primary} size={30} onPress={handleAddCat} />
            </View>
            <View style={styles.chipRow}>
              {categories.map(cat => (
                <Chip key={cat} onClose={() => removeCategory(cat)} style={[styles.chip, { backgroundColor: colors.chip }]} textStyle={{ color: colors.text }}>{cat}</Chip>
              ))}
            </View>
          </Surface>

          {/* Payment Modes */}
          <SectionHeader icon="credit-card-outline" title="Payment Modes" />
          <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={1}>
            <View style={styles.addAppRow}>
              <TextInput value={newModeInput} onChangeText={setNewModeInput} style={[styles.input, { flex: 1, marginBottom: 0, color: colors.text, borderColor: colors.border }]} placeholder="Add new" placeholderTextColor={colors.textSec} />
              <IconButton icon="plus-circle" iconColor={colors.primary} size={30} onPress={handleAddMode} />
            </View>
            <View style={styles.chipRow}>
              {paymentModes.map(mode => (
                <Chip key={mode} onClose={() => removePaymentMode(mode)} style={[styles.chip, { backgroundColor: colors.chip }]} textStyle={{ color: colors.text }}>{mode}</Chip>
              ))}
            </View>
          </Surface>

          {/* UPI Apps */}
          <SectionHeader icon="cellphone-check" title="UPI Options" />
          <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={1}>
            <View style={styles.addAppRow}>
              <TextInput value={newAppInput} onChangeText={setNewAppInput} style={[styles.input, { flex: 1, marginBottom: 0, color: colors.text, borderColor: colors.border }]} placeholder="Add new" placeholderTextColor={colors.textSec} />
              <IconButton icon="plus-circle" iconColor={colors.primary} size={30} onPress={handleAddApp} />
            </View>
            <View style={styles.chipRow}>
              {upiApps.map(app => (
                <Chip key={app} onClose={() => removeUpiApp(app)} style={[styles.chip, { backgroundColor: colors.chip }]} textStyle={{ color: colors.text }}>{app}</Chip>
              ))}
            </View>
          </Surface>

          {/* Data Management */}
          <SectionHeader icon="database-outline" title="Data" />
          <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={1}>
            <Button mode="outlined" onPress={handleReset} textColor={colors.error} style={{ borderColor: colors.error }}>Reset App</Button>
          </Surface>

          <View style={styles.footer}>
            <Text style={[styles.version, { color: colors.textSec }]}>Expense Tracker v2.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingTop: 10, marginBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { paddingHorizontal: 24 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 5 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  card: { borderRadius: 16, padding: 20, marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { fontSize: 16, borderBottomWidth: 1, paddingVertical: 8, marginBottom: 15 },
  saveBtn: { borderRadius: 12 },
  addAppRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: 'transparent' }, 
  footer: { alignItems: 'center', marginTop: 20 },
  version: { fontSize: 12 }
});