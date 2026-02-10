import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, ScrollView, ActivityIndicator, Keyboard } from 'react-native';
import { Text, Surface, IconButton, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

// --- KEYWORDS & LOGIC REMAIN THE SAME ---
const KEYWORD_MAP = {
  'Food': ['breakfast', 'lunch', 'dinner', 'snack', 'tea', 'coffee', 'burger', 'pizza', 'sandwich', 'roti', 'swiggy', 'zomato', 'restaurant', 'milk', 'water', 'cake'],
  'Travel': ['uber', 'ola', 'bus', 'train', 'flight', 'petrol', 'diesel', 'fuel', 'cab', 'auto', 'ticket', 'metro', 'parking'],
  'Bills': ['recharge', 'netflix', 'wifi', 'broadband', 'electricity', 'mobile', 'dth', 'gas', 'rent', 'emi', 'hotstar'],
  'Shopping': ['amazon', 'flipkart', 'myntra', 'clothes', 'shoes', 'jeans', 'shirt', 'watch', 'bag', 'grocery', 'shampoo', 'soap'],
  'Health': ['medicine', 'doctor', 'clinic', 'gym', 'hospital', 'checkup', 'test']
};
const SUCCESS_MSGS = ["Got it! Saved", "Done! Added", "Noted! Tracked", "Easy peasy! Added", "Roger that! Saved"];

export default function ChatScreen({ navigation }) {
  const { colors, addExpense, deleteExpense, categories, paymentModes, upiApps, currency, getFilteredExpenses, expenses } = useExpenses();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastAddedId, setLastAddedId] = useState(null);
  const [messages, setMessages] = useState([{ id: '1', type: 'text', text: "Hi! I'm FinBot. Tell me 'Yesterday Dinner 250' or 'Uber 100'.", sender: 'bot' }]);
  const flatListRef = useRef();
  
  const suggestions = [
    { label: "📊 Today's Summary", cmd: "Show today's summary" },
    { label: "🔙 Yesterday Lunch 150", cmd: "Yesterday Lunch 150" },
    { label: "⛽ Petrol 500", cmd: "Petrol 500" },
    { label: "📈 Weekly Chart", cmd: "Show weekly chart" },
  ];

  // --- LOGIC (Same as before) ---
  const processCommand = (text) => {
    const lower = text.toLowerCase();
    if (lower === 'undo' && lastAddedId) { deleteExpense(lastAddedId); setLastAddedId(null); return { type: 'text', text: "Start over! I removed that last entry. 🗑️" }; }
    if (lower.match(/\d+/) && (lower.includes('add') || lower.includes('spent') || isCategoryKeyword(lower) || lower.includes('yesterday'))) return handleAddCommand(text, lower);
    if (lower.includes('summary') || lower.includes('total')) return handleSummaryCommand(lower);
    if (lower.includes('chart') || lower.includes('graph')) return handleChartCommand();
    if (lower.includes('biggest') || lower.includes('highest')) return handleAnalysisCommand();
    return { type: 'text', text: "I didn't get that. Try 'Lunch 150' or 'Show Chart'." };
  };
  const isCategoryKeyword = (text) => { for (const cat in KEYWORD_MAP) { if (KEYWORD_MAP[cat].some(k => text.includes(k))) return true; } return false; };

  const handleAddCommand = (originalText, lower) => {
    const amountMatch = originalText.match(/(\d+(\.\d+)?)/);
    if (!amountMatch) return { type: 'text', text: "I need an amount! (e.g. '100')" };
    const amount = parseFloat(amountMatch[0]);
    let date = new Date();
    if (lower.includes('yesterday')) date.setDate(date.getDate() - 1);
    
    let category = 'Other';
    let detectedKeyword = '';
    categories.forEach(cat => { if (lower.includes(cat.toLowerCase())) category = cat; });
    if (category === 'Other') { for (const [catName, keywords] of Object.entries(KEYWORD_MAP)) { const match = keywords.find(k => lower.includes(k)); if (match) { category = catName; detectedKeyword = match; break; } } }
    
    let paymentMode = 'Cash'; let paymentApp = null;
    upiApps.forEach(app => { if (lower.includes(app.toLowerCase())) { paymentMode = 'UPI'; paymentApp = app; }});
    if (!paymentApp) { paymentModes.forEach(mode => { if (lower.includes(mode.toLowerCase())) paymentMode = mode; }); }

    let cleanDesc = originalText.replace(amountMatch[0], '').replace(/yesterday|add|spent|paid|bought|via|on|for/gi, '').replace(new RegExp(category, 'gi'), '').replace(new RegExp(paymentMode, 'gi'), '').replace(new RegExp(paymentApp, 'gi'), '').trim();
    const finalTitle = cleanDesc.length > 1 ? cleanDesc : (detectedKeyword ? detectedKeyword.charAt(0).toUpperCase() + detectedKeyword.slice(1) : category);
    const newId = Date.now().toString();
    
    addExpense({ id: newId, name: finalTitle, amount, category, description: `Bot Entry: ${originalText}`, date: date.toISOString(), paymentMode, paymentApp });
    setLastAddedId(newId);
    return { type: 'text', text: `✅ ${SUCCESS_MSGS[Math.floor(Math.random() * SUCCESS_MSGS.length)]} ${currency}${amount} for ${category}.`, showUndo: true };
  };

  const handleSummaryCommand = (lower) => {
    let target = lower.includes('today') ? 'Today' : lower.includes('week') ? 'Week' : 'All';
    const total = getFilteredExpenses(target).reduce((sum, item) => sum + item.amount, 0);
    return { type: 'text', text: `📊 ${target} Total: ${currency}${total}` };
  };
  const handleChartCommand = () => {
    const catTotals = {}; expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
    const chartData = Object.keys(catTotals).map((cat, index) => ({ name: cat, population: catTotals[cat], color: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'][index % 5], legendFontColor: colors.text, legendFontSize: 12 }));
    return chartData.length === 0 ? { type: 'text', text: "No data yet!" } : { type: 'chart', text: "Spending Breakdown:", data: chartData };
  };
  const handleAnalysisCommand = () => {
    if (expenses.length === 0) return { type: 'text', text: "No data." };
    const max = expenses.reduce((p, c) => (p.amount > c.amount) ? p : c);
    return { type: 'text', text: `🏆 Biggest Expense: ${max.name} (${currency}${max.amount})` };
  };

  const sendMessage = (customText = null) => {
    const msgText = customText || input;
    if (!msgText.trim()) return;
    const userMsg = { id: Date.now().toString(), type: 'text', text: msgText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
        const reply = processCommand(msgText);
        const botMsg = { id: (Date.now() + 1).toString(), ...reply, sender: 'bot' };
        setMessages(prev => [...prev, botMsg]);
        setLoading(false);
    }, 500);
  };

  // --- UI RENDER ---
  const renderBubble = (item) => {
    const isBot = item.sender === 'bot';
    return (
        <View style={[styles.bubbleWrapper, isBot ? { alignSelf: 'flex-start' } : { alignSelf: 'flex-end' }]}>
            <Surface style={[styles.bubble, isBot ? { backgroundColor: colors.surface, borderBottomLeftRadius: 0 } : { backgroundColor: colors.primary, borderBottomRightRadius: 0 }]} elevation={1}>
                {item.type === 'text' && <Text style={[styles.msgText, { color: isBot ? colors.text : '#FFF' }]}>{item.text}</Text>}
                {item.type === 'chart' && ( <View><Text style={[styles.msgText, { color: colors.text, marginBottom: 10 }]}>{item.text}</Text><PieChart data={item.data} width={screenWidth * 0.65} height={140} chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }} accessor={"population"} backgroundColor={"transparent"} paddingLeft={"0"} absolute /></View> )}
                {isBot && item.showUndo && ( <TouchableOpacity onPress={() => sendMessage('Undo')} style={{marginTop: 8}}><Text style={{color: colors.primary, fontWeight: 'bold', fontSize: 12}}>↩ Undo</Text></TouchableOpacity> )}
            </Surface>
        </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      
      {/* THE WHATSAPP FIX: 
         Everything (Header + List + Input) is inside the KeyboardAvoidingView.
         behavior="height" forces Android to squeeze the view.
      */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
              <IconButton icon="arrow-left" size={24} iconColor={colors.text} />
          </TouchableOpacity>
          <Avatar.Icon size={40} icon="robot" style={{ backgroundColor: colors.primary, marginRight: 10 }} color="#FFF" />
          <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>FinBot</Text>
              <Text style={[styles.status, { color: colors.success }]}>● Online</Text>
          </View>
        </View>

        {/* CHAT LIST (Flex 1 to take all space) */}
        <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => renderBubble(item)}
            ListFooterComponent={loading && <ActivityIndicator size={16} color={colors.textSec} style={{marginLeft: 20, marginBottom: 10}} />}
            style={{ flex: 1 }} // Crucial for pushing input down
        />
        
        {/* CHIPS */}
        <View style={{ height: 50 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, alignItems: 'center' }}>
                {suggestions.map((chip, index) => (
                    <TouchableOpacity key={index} style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => sendMessage(chip.cmd)}>
                        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{chip.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* INPUT AREA */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg }]}
                placeholder="Ex: 'Yesterday Lunch 200'"
                placeholderTextColor={colors.textSec}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => sendMessage()}
            />
            <IconButton icon="send" size={24} iconColor={colors.primary} onPress={() => sendMessage()} style={{ backgroundColor: colors.inputBg }} />
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, height: 70 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  status: { fontSize: 12, fontWeight: '600' },
  bubbleWrapper: { marginBottom: 15, maxWidth: '85%' },
  bubble: { padding: 12, borderRadius: 16 },
  msgText: { fontSize: 15, lineHeight: 22 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1 },
  input: { flex: 1, height: 45, borderRadius: 24, paddingHorizontal: 20, fontSize: 16, marginRight: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
});