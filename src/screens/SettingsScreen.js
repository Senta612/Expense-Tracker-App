import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import { Text, Button, Surface, IconButton, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from './ExpenseContext';

export default function SettingsScreen({ navigation }) {
  const { username, updateUsername, clearAllData, upiApps, addUpiApp, removeUpiApp } = useExpenses();
  const [nameInput, setNameInput] = useState(username);
  const [newAppInput, setNewAppInput] = useState('');

  const handleSaveName = () => {
    updateUsername(nameInput);
    Alert.alert("Success", "Name updated!");
  };

  const handleAddApp = () => {
    if(newAppInput.trim().length > 0) {
      addUpiApp(newAppInput.trim());
      setNewAppInput('');
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset App?",
      "This will delete ALL your expenses permanently.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Everything", 
          style: "destructive", 
          onPress: () => {
            clearAllData();
            Alert.alert("Reset Complete", "All data has been wiped.");
          }
        }
      ]
    );
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

          {/* --- NEW: UPI Apps Manager --- */}
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.label}>Manage UPI Apps</Text>
            <View style={styles.addAppRow}>
              <TextInput 
                value={newAppInput}
                onChangeText={setNewAppInput}
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Add new (e.g. Cred)"
              />
              <IconButton icon="plus-circle" iconColor="#1A1A1A" size={30} onPress={handleAddApp} />
            </View>

            <View style={styles.chipRow}>
              {upiApps.map(app => (
                <Chip 
                  key={app} 
                  onClose={() => removeUpiApp(app)} 
                  style={styles.chip}
                  textStyle={{ fontSize: 12 }}
                >
                  {app}
                </Chip>
              ))}
            </View>
          </Surface>

          {/* Data Section */}
          <Text style={styles.sectionTitle}>Data Management</Text>
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.rowTitle}>Clear All Data</Text>
            <Button mode="outlined" onPress={handleReset} textColor="#FF5252" style={{ borderColor: '#FF5252', marginTop: 10 }}>
              Reset App
            </Button>
          </Surface>

          <View style={styles.footer}>
            <Text style={styles.version}>Expense Tracker v1.1</Text>
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
  chip: { backgroundColor: '#F5F7FA' },
  rowTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  footer: { alignItems: 'center', marginTop: 20 },
  version: { color: '#ccc', fontSize: 12 }
});