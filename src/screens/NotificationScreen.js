import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform, LayoutAnimation, UIManager, Animated, Keyboard, Vibration, Dimensions } from 'react-native';
import { Text, Switch, IconButton, Button, TextInput, Surface, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useExpenses } from '../context/ExpenseContext';

const { width } = Dimensions.get('window');

// Enable Layout Animations
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Handler to show notifications when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

// --- 1. REMINDER CARD COMPONENT ---
const ReminderCard = ({ item, index, colors, onDeletePress, onSave, onToggle, isOpen, toggleExpand, onCancelNew, isDeleting }) => {
  // Animations
  const slideAnim = useRef(new Animated.Value(50)).current; 
  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const scaleAnim = useRef(new Animated.Value(1)).current; 
  const shakeAnim = useRef(new Animated.Value(0)).current; 

  const [tempData, setTempData] = useState({ title: item.title, body: item.body, time: new Date(item.time) });
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Entrance Animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 100, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 40, delay: index * 100, useNativeDriver: true })
    ]).start();
  }, []);

  // Sync Data
  useEffect(() => {
     setTempData({ title: item.title, body: item.body, time: new Date(item.time) });
  }, [item]);

  // Delete Implosion
  useEffect(() => {
    if (isDeleting) {
        Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true })
        ]).start();
    }
  }, [isDeleting]);

  // Validation Shake
  const triggerShake = () => {
    Vibration.vibrate(50);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const handleSave = () => {
    // 🔒 Validation
    if (!tempData.title || tempData.title.trim() === '') {
        triggerShake();
        return;
    }
    onSave(item.id, tempData);
  };

  return (
    <Animated.View style={{ 
        opacity: fadeAnim, 
        transform: [
            { translateY: slideAnim }, 
            { translateX: shakeAnim },
            { scale: scaleAnim }
        ],
        marginBottom: 16 
    }}>
      <Surface 
        style={[
            styles.card, 
            { 
                backgroundColor: colors.surface, 
                // FLAT when closed (Clean Look), Border when Open
                borderColor: isOpen ? colors.primary : colors.border,
                borderWidth: isOpen ? 1.5 : 1,
                
                // NO SHADOW when closed (Fixes the entrance glitch)
                elevation: isOpen ? 8 : 0, 
                shadowColor: isOpen ? "#000" : "transparent",
                shadowOpacity: isOpen ? 0.15 : 0,
                shadowRadius: isOpen ? 8 : 0,
            }
        ]} 
      >
        {/* HEADER */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => toggleExpand(item.id)} style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: item.active ? colors.primary + '15' : colors.background }]}>
                <Avatar.Icon size={42} icon={item.icon || 'bell-ring'} color={item.active ? colors.primary : colors.textSec} style={{backgroundColor: 'transparent'}} />
            </View>

            <View style={{flex: 1, paddingHorizontal: 12}}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={[styles.cardTitle, { color: colors.text, opacity: item.active ? 1 : 0.5 }]}>
                        {item.title || "New Reminder"} 
                    </Text>
                    {!item.title && <Text style={{color: colors.error, fontSize: 14, fontWeight: 'bold'}}> *</Text>}
                </View>

                {!isOpen && (
                    <Text style={{color: colors.primary, fontWeight: '700', fontSize: 12, marginTop: 4}}>
                        {new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                )}
            </View>

            {!isOpen ? (
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <TouchableOpacity onPress={() => toggleExpand(item.id)} style={[styles.miniBtn, {backgroundColor: colors.background, marginRight: 8}]}>
                        <IconButton icon="pencil" size={18} iconColor={colors.textSec} style={{margin: 0}} />
                    </TouchableOpacity>
                    <Switch value={item.active} onValueChange={() => onToggle(item.id)} color={colors.primary} />
                </View>
            ) : (
                <IconButton icon="chevron-up" iconColor={colors.primary} size={24} onPress={() => toggleExpand(item.id)} />
            )}
        </TouchableOpacity>

        {/* EXPANDED CONTENT */}
        {isOpen && (
            <View style={styles.expandedContent}>
                <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                    <View style={{flexDirection: 'row'}}>
                         <Text style={{color: colors.textSec, fontSize: 10, marginBottom: 2}}>Title</Text>
                         <Text style={{color: colors.error, fontSize: 10, marginBottom: 2}}> *</Text>
                    </View>
                    <TextInput 
                        value={tempData.title} onChangeText={t => setTempData({...tempData, title: t})}
                        style={[styles.rawInput, { color: colors.text, fontWeight: 'bold' }]}
                        placeholder="e.g. Dinner" placeholderTextColor={colors.textSec}
                        underlineColorAndroid="transparent"
                        dense
                        autoFocus={!item.title}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <Text style={{color: colors.textSec, fontSize: 10, marginBottom: 2, marginTop: 8}}>Message</Text>
                    <TextInput 
                        value={tempData.body} onChangeText={t => setTempData({...tempData, body: t})}
                        style={[styles.rawInput, { color: colors.text }]}
                        placeholder="e.g. Log your expense..." placeholderTextColor={colors.textSec}
                        underlineColorAndroid="transparent"
                        dense
                    />
                </View>

                <TouchableOpacity onPress={() => setShowTimePicker(true)} style={[styles.timeBtn, { backgroundColor: colors.background }]}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <IconButton icon="clock-outline" size={18} iconColor={colors.primary} style={{margin: 0}} />
                        <Text style={{color: colors.textSec, marginLeft: 5, fontWeight: '500'}}>Time</Text>
                        <Text style={{color: colors.error, fontSize: 12}}> *</Text>
                    </View>
                    <Text style={{color: colors.text, fontWeight: 'bold', fontSize: 18}}>
                        {tempData.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                </TouchableOpacity>

                {showTimePicker && (
                    <DateTimePicker value={tempData.time} mode="time" display="spinner" onChange={(e, d) => { setShowTimePicker(false); if(d) setTempData({...tempData, time: d}); }} />
                )}

                <View style={styles.actionRow}>
                    {!item.saved ? (
                        <Button 
                            mode="outlined" 
                            onPress={() => onCancelNew(item.id)} 
                            style={{flex: 1, borderColor: colors.border, borderRadius: 12, marginRight: 10}} 
                            textColor={colors.textSec}
                            labelStyle={{fontSize: 13}}
                        >
                            Cancel
                        </Button>
                    ) : (
                        <TouchableOpacity onPress={() => onDeletePress(item.id)} style={[styles.deleteBtn, { backgroundColor: colors.error + '15', marginRight: 10 }]}>
                            <IconButton icon="trash-can-outline" size={22} iconColor={colors.error} style={{margin: 0}} />
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary, flex: 2 }]}>
                        <Text style={[styles.saveText, { fontSize: 14 }]} numberOfLines={1}>
                            {item.saved ? "Save Changes" : "Add Reminder"}
                        </Text>
                        <IconButton icon="check" size={16} iconColor="#FFF" style={{margin: 0}} />
                    </TouchableOpacity>
                </View>
            </View>
        )}
      </Surface>
    </Animated.View>
  );
};

// --- 2. ANIMATED ALERT (Fixed Open & Close) ---
const CustomAlert = ({ visible, onClose, onConfirm, colors }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true })
      ]).start();
    } else {
        // We reset manually when unmounting, but the parent handles the delay
        scaleAnim.setValue(0);
        fadeAnim.setValue(0);
    }
  }, [visible]);

  // Special "Closing" function to animate OUT before telling parent to hide
  const animateClose = (callback) => {
    Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.8, duration: 200, useNativeDriver: true })
    ]).start(() => callback());
  };

  const handleCancel = () => animateClose(onClose);
  const handleDelete = () => animateClose(onConfirm);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={handleCancel}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.alertBox, { backgroundColor: colors.surface, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={[styles.alertIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <IconButton icon="trash-can" size={32} iconColor={colors.error} style={{margin: 0}} />
            </View>
            <Text style={[styles.alertTitle, { color: colors.text }]}>Delete Reminder?</Text>
            <Text style={[styles.alertDesc, { color: colors.textSec }]}>This will remove it permanently.</Text>
            
            <View style={styles.alertBtnRow}>
                <Button mode="text" onPress={handleCancel} textColor={colors.textSec} style={{flex: 1}}>Cancel</Button>
                <Button mode="contained" onPress={handleDelete} buttonColor={colors.error} style={{flex: 1, borderRadius: 12}}>Delete</Button>
            </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function NotificationScreen({ navigation }) {
  const { colors } = useExpenses();
  const [reminders, setReminders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  
  const [alertVisible, setAlertVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null); 

  const [undoData, setUndoData] = useState(null);
  const undoAnim = useRef(new Animated.Value(150)).current;

  // --- 💾 LOAD & SAVE ---
  useEffect(() => { loadReminders(); }, []);

  const loadReminders = async () => {
    try {
      const stored = await AsyncStorage.getItem('user_reminders');
      let loadedData = [];
      if (stored) loadedData = JSON.parse(stored);

      if (!loadedData || loadedData.length === 0) {
        // 🚀 DEFAULT DATA (5 Items)
        const defaults = [
            { id: '1', title: 'Breakfast 🍳', icon: 'coffee-outline', body: 'Start your day!', time: new Date().setHours(9, 30, 0, 0), active: true, saved: true },
            { id: '2', title: 'Lunch 🥗', icon: 'food-variant', body: 'Track lunch expense', time: new Date().setHours(14, 0, 0, 0), active: true, saved: true },
            { id: '3', title: 'Dinner 🍽️', icon: 'silverware-fork-knife', body: 'Wrap up the day', time: new Date().setHours(21, 0, 0, 0), active: true, saved: true },
            { id: '4', title: 'SIP Investment 💰', icon: 'chart-line', body: 'Monthly Investment (1st)', time: new Date().setHours(10, 0, 0, 0), active: true, saved: true },
            { id: '5', title: 'Petrol ⛽', icon: 'gas-station', body: 'Weekly Refill (Monday)', time: new Date().setHours(18, 0, 0, 0), active: true, saved: true },
        ];
        setReminders(defaults);
        saveToStorage(defaults);
      } else {
        setReminders(loadedData.map(r => ({ ...r, time: new Date(r.time), saved: true })));
      }
    } catch (e) { console.error(e); }
  };

  const saveToStorage = async (data) => {
    const validData = data.filter(item => item.saved);
    await AsyncStorage.setItem('user_reminders', JSON.stringify(validData));
  };

  const animateLayout = () => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); };

  const handleSaveEdit = (id, newData) => {
    animateLayout();
    const updated = reminders.map(item => item.id === id ? { ...item, ...newData, saved: true } : item);
    setReminders(updated);
    saveToStorage(updated);
    
    // Notification Logic
    const item = updated.find(r => r.id === id);
    if (item.active) scheduleNotification(item);

    setExpandedId(null);
    Keyboard.dismiss();
  };

  const scheduleNotification = async (reminder) => {
    if (!reminder.active) return;
    await Notifications.cancelScheduledNotificationAsync(reminder.id);
    const trigger = { hour: new Date(reminder.time).getHours(), minute: new Date(reminder.time).getMinutes(), repeats: true };
    await Notifications.scheduleNotificationAsync({ identifier: reminder.id, content: { title: reminder.title, body: reminder.body, sound: true }, trigger });
  };

  const handleCancelNew = (id) => {
    animateLayout();
    setReminders(prev => prev.filter(item => item.id !== id));
  };

  const requestDelete = (id) => {
    setItemToDelete(id);
    setAlertVisible(true);
  };

  const confirmDelete = () => {
    setAlertVisible(false); // Parent state update (Alert handles animation internally before calling this)
    if (!itemToDelete) return;

    // Trigger Card Implosion
    setDeletingId(itemToDelete); 
    const item = reminders.find(r => r.id === itemToDelete);
    setUndoData(item);

    // Wait for Card Animation (300ms) then remove
    setTimeout(() => {
        animateLayout();
        const updated = reminders.filter(r => r.id !== itemToDelete);
        setReminders(updated);
        saveToStorage(updated);
        Notifications.cancelScheduledNotificationAsync(itemToDelete);
        setDeletingId(null);
        setItemToDelete(null);
        showUndo();
    }, 300);
  };

  const showUndo = () => {
    Animated.spring(undoAnim, { toValue: 0, useNativeDriver: true }).start();
    setTimeout(() => hideUndo(), 5000);
  };

  const hideUndo = () => {
    Animated.timing(undoAnim, { toValue: 150, duration: 300, useNativeDriver: true }).start(() => setUndoData(null));
  };

  const performUndo = () => {
    if (!undoData) return;
    animateLayout();
    const updated = [...reminders, undoData];
    setReminders(updated);
    saveToStorage(updated);
    hideUndo();
  };

  const addNew = () => {
    const newId = Date.now().toString();
    const newReminder = { 
        id: newId, 
        title: '', 
        icon: 'bell-ring-outline', 
        body: '', 
        time: new Date(), 
        active: true,
        saved: false 
    };
    animateLayout();
    setReminders([newReminder, ...reminders]); 
    setExpandedId(newId);
  };

  const toggleExpand = (id) => {
    animateLayout();
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.roundBtn, { backgroundColor: colors.surface }]}>
                <IconButton icon="arrow-left" size={24} iconColor={colors.text} style={{margin: 0}} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Reminders</Text>
        </View>
        <TouchableOpacity onPress={addNew} style={[styles.roundBtn, { backgroundColor: colors.primary }]}>
             <IconButton icon="plus" size={24} iconColor="#FFF" style={{margin: 0}} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
        {reminders.map((item, index) => (
            <ReminderCard 
                key={item.id} 
                item={item} 
                index={index} 
                colors={colors}
                isOpen={expandedId === item.id}
                isDeleting={deletingId === item.id}
                onDeletePress={requestDelete}
                onCancelNew={handleCancelNew}
                onSave={handleSaveEdit}
                onToggle={(id) => {
                    const updated = reminders.map(i => i.id === id ? { ...i, active: !i.active } : i);
                    setReminders(updated);
                    saveToStorage(updated);
                }}
                toggleExpand={toggleExpand}
            />
        ))}
        {reminders.length === 0 && (
            <Text style={{textAlign: 'center', color: colors.textSec, marginTop: 50}}>Tap + to add a reminder</Text>
        )}
      </ScrollView>

      {/* ALERT */}
      <CustomAlert 
        visible={alertVisible} 
        onClose={() => setAlertVisible(false)} // Just closes modal
        onConfirm={confirmDelete} // Triggers delete logic
        colors={colors}
      />

      {/* UNDO BAR */}
      <Animated.View style={[styles.undoContainer, { transform: [{ translateY: undoAnim }] }]}>
          <Surface style={[styles.undoBar, { backgroundColor: '#333' }]} elevation={4}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <IconButton icon="trash-can-outline" size={20} iconColor="#FFF" />
                  <Text style={{color: '#FFF', fontWeight: 'bold'}}>Deleted.</Text>
              </View>
              <TouchableOpacity onPress={performUndo} style={{padding: 10}}>
                  <Text style={{color: colors.primary, fontWeight: 'bold', fontSize: 16}}>UNDO</Text>
              </TouchableOpacity>
          </Surface>
      </Animated.View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  headerTitle: { fontSize: 26, fontWeight: '800', marginLeft: 15 },
  roundBtn: { borderRadius: 50, padding: 4, elevation: 0 }, 

  card: { borderRadius: 24, overflow: 'hidden' }, 
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  miniBtn: { borderRadius: 50, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

  expandedContent: { paddingHorizontal: 16, paddingBottom: 20 },
  inputContainer: { borderRadius: 16, overflow: 'hidden', padding: 15, marginBottom: 12 },
  
  rawInput: { fontSize: 16, height: 35, backgroundColor: 'transparent', paddingHorizontal: 0 },
  divider: { height: 1, opacity: 0.1, marginVertical: 8 },

  timeBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 20 },

  actionRow: { flexDirection: 'row', alignItems: 'center' },
  deleteBtn: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  
  saveBtn: { flex: 2, height: 56, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  saveText: { color: '#FFF', fontWeight: 'bold', marginRight: 5 },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 40 },
  alertBox: { width: '100%', borderRadius: 28, padding: 24, alignItems: 'center' },
  alertIconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  alertTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  alertDesc: { fontSize: 14, textAlign: 'center', marginBottom: 24, opacity: 0.7 },
  alertBtnRow: { flexDirection: 'row', width: '100%', gap: 10 },

  // UNDO BAR
  undoContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, alignItems: 'center' },
  undoBar: { width: '100%', borderRadius: 16, padding: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
});