import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Surface, IconButton, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

// --- KEYWORDS MAP ---
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
  const flatListRef = useRef();

  const [messages, setMessages] = useState([
      { id: '1', type: 'text', text: "Hi! I'm FinBot 🤖. Tell me 'Yesterday Dinner 250' or 'Uber 100'.", sender: 'bot', timestamp: new Date() }
  ]);
  
  const suggestions = [
    { label: "📊 Today's Summary", cmd: "Show today's summary" },
    { label: "🔙 Yesterday Lunch 150", cmd: "Yesterday Lunch 150" },
    { label: "⛽ Petrol 500", cmd: "Petrol 500" },
    { label: "📈 Weekly Chart", cmd: "Show weekly chart" },
  ];

  // --- 🧠 SMART LOGIC ENGINE (Preserved from your code) ---
  const processCommand = (text) => {
    const lower = text.toLowerCase();
    if (lower === 'undo' && lastAddedId) { 
        deleteExpense(lastAddedId); 
        setLastAddedId(null); 
        return { type: 'text', text: "Start over! I removed that last entry. 🗑️" }; 
    }
    if (lower.match(/\d+/) && (lower.includes('add') || lower.includes('spent') || isCategoryKeyword(lower) || lower.includes('yesterday'))) {
        return handleAddCommand(text, lower);
    }
    if (lower.includes('summary') || lower.includes('total')) return handleSummaryCommand(lower);
    if (lower.includes('chart') || lower.includes('graph')) return handleChartCommand();
    if (lower.includes('biggest') || lower.includes('highest')) return handleAnalysisCommand();
    
    return { type: 'text', text: "I didn't get that. Try 'Lunch 150' or 'Show Chart'." };
  };

  const isCategoryKeyword = (text) => { 
      for (const cat in KEYWORD_MAP) { 
          if (KEYWORD_MAP[cat].some(k => text.includes(k))) return true; 
      } 
      return false; 
  };

  const handleAddCommand = (originalText, lower) => {
    const amountMatch = originalText.match(/(\d+(\.\d+)?)/);
    if (!amountMatch) return { type: 'text', text: "I need an amount! (e.g. '100')" };
    
    const amount = parseFloat(amountMatch[0]);
    let date = new Date();
    if (lower.includes('yesterday')) date.setDate(date.getDate() - 1);
    
    let category = 'Other';
    let detectedKeyword = '';
    categories.forEach(cat => { if (lower.includes(cat.toLowerCase())) category = cat; });
    
    if (category === 'Other') { 
        for (const [catName, keywords] of Object.entries(KEYWORD_MAP)) { 
            const match = keywords.find(k => lower.includes(k)); 
            if (match) { category = catName; detectedKeyword = match; break; } 
        } 
    }
    
    let paymentMode = 'Cash'; let paymentApp = null;
    upiApps.forEach(app => { if (lower.includes(app.toLowerCase())) { paymentMode = 'UPI'; paymentApp = app; }});
    if (!paymentApp) { paymentModes.forEach(mode => { if (lower.includes(mode.toLowerCase())) paymentMode = mode; }); }

    let cleanDesc = originalText.replace(amountMatch[0], '').replace(/yesterday|add|spent|paid|bought|via|on|for/gi, '').replace(new RegExp(category, 'gi'), '').replace(new RegExp(paymentMode, 'gi'), '').replace(new RegExp(paymentApp, 'gi'), '').trim();
    const finalTitle = cleanDesc.length > 1 ? cleanDesc : (detectedKeyword ? detectedKeyword.charAt(0).toUpperCase() + detectedKeyword.slice(1) : category);
    
    const newId = Date.now().toString();
    
    // Auto-adds as an expense
    addExpense({ id: newId, type: 'expense', name: finalTitle, amount, category, description: `Bot Entry: ${originalText}`, date: date.toISOString(), paymentMode, paymentApp });
    setLastAddedId(newId);
    
    return { type: 'text', text: `✅ ${SUCCESS_MSGS[Math.floor(Math.random() * SUCCESS_MSGS.length)]} ${currency}${amount} for ${category}.`, showUndo: true };
  };

  const handleSummaryCommand = (lower) => {
    let target = lower.includes('today') ? 'Today' : lower.includes('week') ? 'Week' : 'All';
    const total = getFilteredExpenses(target).reduce((sum, item) => sum + item.amount, 0);
    return { type: 'text', text: `📊 ${target} Total: ${currency}${total}` };
  };

  const handleChartCommand = () => {
    const catTotals = {}; 
    expenses.filter(e => e.type === 'expense' || !e.type).forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
    
    const chartData = Object.keys(catTotals).map((cat, index) => ({ 
        name: cat, 
        population: catTotals[cat], 
        color: [colors.primary, colors.accent || '#6200EE', '#00C853', '#FFB300', '#FF5252'][index % 5], 
        legendFontColor: colors.text, 
        legendFontSize: 12 
    }));
    
    return chartData.length === 0 ? { type: 'text', text: "No data yet!" } : { type: 'chart', text: "Here is your spending breakdown:", data: chartData };
  };

  const handleAnalysisCommand = () => {
    const expenseList = expenses.filter(e => e.type === 'expense' || !e.type);
    if (expenseList.length === 0) return { type: 'text', text: "No data to analyze." };
    const max = expenseList.reduce((p, c) => (p.amount > c.amount) ? p : c);
    return { type: 'text', text: `🏆 Biggest Expense: **${max.name}** (${currency}${max.amount})` };
  };

  // --- SENDING MESSAGES ---
  const sendMessage = (customText = null) => {
    const msgText = customText || input;
    if (!msgText.trim()) return;
    
    const userMsg = { id: Date.now().toString(), type: 'text', text: msgText, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    
    // Simulate thinking delay
    setTimeout(() => {
        const reply = processCommand(msgText);
        const botMsg = { id: (Date.now() + 1).toString(), ...reply, sender: 'bot', timestamp: new Date() };
        setMessages(prev => [...prev, botMsg]);
        setLoading(false);
    }, 600);
  };

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  // --- UI RENDERERS ---
  const formatText = (text) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) return <Text key={index} style={{fontWeight: 'bold'}}>{part.replace(/\*\*/g, '')}</Text>;
          return part;
      });
  };

  const renderBubble = ({ item }) => {
    const isBot = item.sender === 'bot';
    return (
      <View style={[styles.messageWrapper, isBot ? styles.messageWrapperBot : styles.messageWrapperUser]}>
        {isBot && (
            <Avatar.Icon size={30} icon="robot-outline" color="#FFF" style={{ backgroundColor: colors.accent || '#6200EE', marginRight: 8, marginBottom: 5 }} />
        )}
        <Surface style={[
            styles.bubble, 
            { backgroundColor: isBot ? colors.surface : colors.primary },
            isBot ? { borderBottomLeftRadius: 4 } : { borderBottomRightRadius: 4 }
        ]} elevation={isBot ? 1 : 0}>
            
            {/* TEXT RENDER */}
            {item.type === 'text' && (
                <Text style={[styles.msgText, { color: isBot ? colors.text : '#FFF' }]}>{formatText(item.text)}</Text>
            )}

            {/* CHART RENDER */}
            {item.type === 'chart' && (
                <View style={{alignItems: 'center'}}>
                    <Text style={[styles.msgText, { color: colors.text, marginBottom: 15, alignSelf: 'flex-start' }]}>{item.text}</Text>
                    <PieChart 
                        data={item.data} 
                        width={screenWidth * 0.65} 
                        height={140} 
                        chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }} 
                        accessor={"population"} 
                        backgroundColor={"transparent"} 
                        paddingLeft={"0"} 
                        absolute 
                    />
                </View>
            )}

            {/* UNDO BUTTON */}
            {isBot && item.showUndo && ( 
                <TouchableOpacity onPress={() => sendMessage('Undo')} style={styles.undoBtn}>
                    <Text style={{color: colors.primary, fontWeight: 'bold', fontSize: 13}}>↩ Undo this entry</Text>
                </TouchableOpacity> 
            )}

            <Text style={[styles.timestamp, { color: isBot ? colors.textSec : 'rgba(255,255,255,0.7)' }]}>
                {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </Surface>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <IconButton icon="arrow-left" size={24} iconColor={colors.text} style={{margin:0}} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>FinBot AI</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={styles.onlineDot} />
                <Text style={{color: colors.success, fontSize: 12, fontWeight: '600', marginLeft: 4}}>Online</Text>
            </View>
        </View>
        <View style={{width: 40}} /> 
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* CHAT LIST */}
        <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatContainer}
            showsVerticalScrollIndicator={false}
            renderItem={renderBubble}
        />

        {/* TYPING INDICATOR */}
        {loading && (
            <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color={colors.accent || '#6200EE'} />
                <Text style={{color: colors.textSec, marginLeft: 8, fontSize: 12}}>FinBot is analyzing...</Text>
            </View>
        )}
        
        {/* SUGGESTION CHIPS */}
        <View style={{ height: 50, marginBottom: 5 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, alignItems: 'center' }}>
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
                style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
                placeholder="Ex: 'Yesterday Lunch 200'"
                placeholderTextColor={colors.textSec}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => sendMessage()}
                returnKeyType="send"
            />
            <TouchableOpacity onPress={() => sendMessage()} disabled={!input.trim()}>
                <View style={[styles.sendButton, { backgroundColor: input.trim() ? colors.primary : colors.inputBg }]}>
                    <IconButton icon="send" size={20} iconColor={input.trim() ? '#FFF' : colors.textSec} style={{margin:0}} />
                </View>
            </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 1 },
  iconBtn: { padding: 5 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C853' },
  
  chatContainer: { padding: 15, paddingBottom: 20 },
  
  messageWrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 15, maxWidth: '85%' },
  messageWrapperUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  messageWrapperBot: { alignSelf: 'flex-start' },
  
  bubble: { padding: 14, borderRadius: 20 },
  msgText: { fontSize: 15, lineHeight: 22 },
  timestamp: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },
  
  undoBtn: { marginTop: 10, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(0,0,0,0.05)', alignSelf: 'flex-start', borderRadius: 12 },

  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 1 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 15, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 24, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12, fontSize: 15, borderWidth: 1, maxHeight: 100 },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});