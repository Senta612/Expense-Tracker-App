// src/screens/ChatScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { Text, Surface, IconButton, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';
import { PieChart } from 'react-native-chart-kit';

// ✨ IMPORT THE NEW COMPONENT
import FinBotHelpModal from '../components/FinBotHelpModal'; 

const { width: screenWidth } = Dimensions.get('window');

// --- KEYWORDS MAP ---
const KEYWORD_MAP = {
  'Food': ['breakfast', 'lunch', 'dinner', 'snack', 'tea', 'coffee', 'burger', 'pizza', 'sandwich', 'roti', 'swiggy', 'zomato', 'restaurant', 'milk', 'water', 'cake'],
  'Travel': ['uber', 'ola', 'bus', 'train', 'flight', 'petrol', 'diesel', 'fuel', 'cab', 'auto', 'ticket', 'metro', 'parking'],
  'Bills': ['recharge', 'netflix', 'wifi', 'broadband', 'electricity', 'mobile', 'dth', 'gas', 'rent', 'emi', 'hotstar'],
  'Shopping': ['amazon', 'flipkart', 'myntra', 'clothes', 'shoes', 'jeans', 'shirt', 'watch', 'bag', 'grocery', 'shampoo', 'soap'],
  'Health': ['medicine', 'doctor', 'clinic', 'gym', 'hospital', 'checkup', 'test']
};

const COLOR_PALETTE = ['#6B52FF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#96CEB4', '#DDA0DD', '#42A5F5', '#FF7043', '#26A69A'];
const FALLBACK_COLOR = '#B0BEC5';

// --- CHART COMPONENTS ---
const LegendItem = ({ d, index, colors, currency }) => {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: 400 + (index * 150), useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 6, delay: 400 + (index * 150), useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.legendRow, { borderBottomColor: colors.border, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.legendDot, { backgroundColor: d.color }]} />
        <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>{d.name}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>-{currency}{d.population.toLocaleString('en-IN')}</Text>
        <Text style={{ fontSize: 12, color: colors.textSec, marginTop: 2, fontWeight: '500' }}>{d.percentage}</Text>
      </View>
    </Animated.View>
  );
};

const AnimatedChartBubble = ({ item, colors, currency }) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true })
    ]).start();
  }, []);

  const chartSize = Math.min(screenWidth * 0.55, 180);
  const donutHoleSize = chartSize * 0.45;
  const dynamicChartData = item.data.map(d => ({ ...d, legendFontColor: colors.text, legendFontSize: 12 }));

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], width: '100%' }}>
      <Text style={[styles.chartTitle, { color: colors.text }]}>Spending Breakdown</Text>
      <View style={[styles.donutContainer, { width: chartSize, height: chartSize, aspectRatio: 1 }]}>
        <PieChart 
          data={dynamicChartData} 
          width={chartSize + 60} 
          height={chartSize} 
          hasLegend={false}
          chartConfig={{ color: (opacity = 1) => colors.text, labelColor: (opacity = 1) => colors.text }} 
          accessor={"population"} 
          backgroundColor={"transparent"} 
          paddingLeft={"30"} 
        />
        <View style={[styles.donutHole, { backgroundColor: colors.surface, width: donutHoleSize, height: donutHoleSize, borderRadius: donutHoleSize / 2 }]}>
          <Text style={{ fontSize: 8, color: colors.textSec, fontWeight: '700', letterSpacing: 1 }}>TOTAL</Text>
          <Text style={{ fontSize: 14, fontWeight: '900', color: colors.text, marginTop: 2 }}>{currency}{item.totalSum.toLocaleString('en-IN')}</Text>
        </View>
      </View>
      <Text style={[styles.chartHint, { color: colors.textSec }]}>Tap a category below</Text>
      <View style={{ width: '100%' }}>
        {item.data.map((d, i) => (
          <LegendItem key={d.name} d={d} index={i} colors={colors} currency={currency} />
        ))}
      </View>
    </Animated.View>
  );
};


export default function ChatScreen({ navigation }) {
  const { colors, addExpense, editExpense, deleteExpense, categories, paymentModes, upiApps, currency, getFilteredExpenses, expenses } = useExpenses();
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastAddedId, setLastAddedId] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  const flatListRef = useRef();
  const inputRef = useRef();

  const [messages, setMessages] = useState([
    { id: '1', type: 'text', text: "Hi! I'm FinBot 🤖. I make logging money as easy as sending a text.\n\nTap the **?** icon at the top to see what I can do!", sender: 'bot', timestamp: new Date() }
  ]);
  
  const suggestions = [
    { label: "Today's Summary", cmd: "Show today's summary" },
    { label: "Bought Shoes 2000", cmd: "Bought Shoes 2000 via Card" },
    { label: "Got 5000 Salary", cmd: "Got 5000 salary" },
    { label: "Show Chart", cmd: "Show chart" },
  ];

  const processCommand = (text) => {
    const lower = text.toLowerCase();
    
    if (lower === 'undo' && lastAddedId) { 
      deleteExpense(lastAddedId); 
      setLastAddedId(null); 
      return { type: 'text', text: "Done! I removed that entry. 🗑️" }; 
    }
    if (lower.includes('change last amount') || lower.includes('update last amount')) {
      return handleUpdateCommand(text);
    }
    if (lower.match(/\d+/) && (lower.includes('add') || lower.includes('spent') || lower.includes('paid') || lower.includes('got') || lower.includes('salary') || isCategoryKeyword(lower) || lower.includes('yesterday') || lower.includes('for '))) {
      return handleAddCommand(text, lower);
    }
    if (lower.includes('summary') || lower.includes('total')) return handleSummaryCommand(lower);
    if (lower.includes('chart') || lower.includes('graph')) return handleChartCommand();
    if (lower.includes('biggest') || lower.includes('highest')) return handleAnalysisCommand();
    
    return { type: 'text', text: "Hmm, I didn't quite catch that. Try tapping the **?** icon above for some magic words! ✨" };
  };

  const isCategoryKeyword = (text) => { 
    for (const cat in KEYWORD_MAP) { if (KEYWORD_MAP[cat].some(k => text.includes(k))) return true; } 
    return false; 
  };

  const parseDateString = (lower) => {
      let date = new Date();
      if (lower.includes('day before yesterday')) {
          date.setDate(date.getDate() - 2);
      } else if (lower.includes('yesterday')) {
          date.setDate(date.getDate() - 1);
      } else {
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          for (let i = 0; i < days.length; i++) {
              if (lower.includes(`last ${days[i]}`)) {
                  let today = date.getDay();
                  let diff = today - i;
                  if (diff <= 0) diff += 7; 
                  date.setDate(date.getDate() - diff);
                  break;
              }
          }
      }
      return date;
  }

  const handleUpdateCommand = (text) => {
      if (!lastAddedId) return { type: 'text', text: "I don't remember your last entry! 😅" };
      const amountMatch = text.match(/(\d+(\.\d+)?)/);
      if (!amountMatch) return { type: 'text', text: "Please specify the new amount (e.g., 'change last amount to 500')." };
      const newAmount = parseFloat(amountMatch[0]);
      const lastExp = expenses.find(e => e.id === lastAddedId);
      if (!lastExp) return { type: 'text', text: "Hmm, I couldn't find the last entry in the database." };

      editExpense({ ...lastExp, amount: newAmount });
      return { type: 'text', text: `✏️ Done! Updated **${lastExp.name}** to ${currency}${newAmount}.` };
  };

  const handleAddCommand = (originalText, lower) => {
    const amountMatch = originalText.match(/(\d+(\.\d+)?)/);
    if (!amountMatch) return { type: 'text', text: "I need an amount! (e.g. '100')" };
    
    const amount = parseFloat(amountMatch[0]);
    let date = parseDateString(lower); 
    
    let description = "";
    let workingText = originalText;
    const noteMatch = originalText.match(/\b(?:note|desc|description)s?:?\s*(.*)/i);
    if (noteMatch) {
        description = noteMatch[1].trim();
        workingText = originalText.replace(noteMatch[0], '').trim(); 
        lower = workingText.toLowerCase(); 
    }

    const isIncome = /\b(got|received|salary|earned|refund|credited|income)\b/i.test(lower);
    const transactionType = isIncome ? 'income' : 'expense';

    let finalTitle = "";
    let paymentMode = isIncome ? 'One-time' : 'Cash';
    let paymentApp = null;

    const forMatch = workingText.match(/\bfor\s+([a-zA-Z0-9_]+)\b/i);
    if (forMatch) finalTitle = forMatch[1].charAt(0).toUpperCase() + forMatch[1].slice(1);

    const viaMatch = workingText.match(/\bvia\s+([a-zA-Z0-9_]+)\b/i);
    let viaWord = "";
    if (viaMatch) {
        viaWord = viaMatch[1].toLowerCase();
        const matchedApp = upiApps.find(a => a.toLowerCase() === viaWord);
        if (matchedApp) {
            paymentMode = 'UPI';
            paymentApp = matchedApp;
        } else {
            const matchedMode = paymentModes.find(m => m.toLowerCase() === viaWord);
            if (matchedMode) paymentMode = matchedMode;
            else paymentMode = viaMatch[1].charAt(0).toUpperCase() + viaMatch[1].slice(1); 
        }
    } else {
        upiApps.forEach(app => { if (lower.includes(app.toLowerCase())) { paymentMode = 'UPI'; paymentApp = app; }});
        if (!paymentApp) { paymentModes.forEach(mode => { if (lower.includes(mode.toLowerCase())) paymentMode = mode; }); }
    }

    let category = isIncome ? 'Income' : 'Other';
    let detectedKeyword = '';
    if (!isIncome) {
        categories.forEach(cat => { if (lower.includes(cat.toLowerCase())) category = cat; });
        if (category === 'Other') { 
            for (const [catName, keywords] of Object.entries(KEYWORD_MAP)) { 
                const match = keywords.find(k => lower.includes(k)); 
                if (match) { category = catName; detectedKeyword = match; break; } 
            } 
        }
    }

    if (!finalTitle) {
        let cleanDesc = workingText.replace(amountMatch[0], '')
            .replace(/\b(got|received|salary|earned|refund|yesterday|add|spent|paid|bought|via|on|for)\b/gi, '')
            .replace(new RegExp(`\\b${category}\\b`, 'gi'), '')
            .replace(new RegExp(`\\b${paymentMode}\\b`, 'gi'), '')
            .replace(new RegExp(`\\b${paymentApp || ''}\\b`, 'gi'), '')
            .replace(new RegExp(`\\b${viaWord}\\b`, 'gi'), '')
            .replace(/(day before yesterday|last monday|last tuesday|last wednesday|last thursday|last friday|last saturday|last sunday)/gi, '')
            .replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').trim(); 

        if (isIncome && cleanDesc.length < 2) {
            const incMatch = lower.match(/(salary|bonus|gift|refund)/i);
            finalTitle = incMatch ? incMatch[0].charAt(0).toUpperCase() + incMatch[0].slice(1) : "Income";
        } else if (cleanDesc.length > 1) {
            finalTitle = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);
        } else {
            finalTitle = detectedKeyword ? detectedKeyword.charAt(0).toUpperCase() + detectedKeyword.slice(1) : category;
        }
    }

    if(!description) description = `Bot Entry: ${originalText}`;
    
    const newId = Date.now().toString();
    addExpense({ id: newId, type: transactionType, name: finalTitle, amount, category, description, date: date.toISOString(), paymentMode, paymentApp });
    setLastAddedId(newId);
    
    const typeEmoji = isIncome ? '💸' : '✅';
    return { type: 'text', text: `${typeEmoji} Saved! **${currency}${amount}** for **${finalTitle}**.\n*(Cat: ${category} | Mode: ${paymentApp || paymentMode})*`, showUndo: true };
  };

  const handleSummaryCommand = (lower) => {
    let target = lower.includes('today') ? 'Today' : lower.includes('week') ? 'Week' : 'All';
    const total = getFilteredExpenses(target).reduce((sum, item) => sum + item.amount, 0);
    return { type: 'text', text: `📊 ${target} Total: ${currency}${total.toLocaleString('en-IN')}` };
  };

  const handleChartCommand = () => {
    const expenseList = expenses.filter(e => e.type === 'expense' || !e.type);
    if (expenseList.length === 0) return { type: 'text', text: "No data yet!" };

    const catTotals = {}; 
    let totalSum = 0;
    expenseList.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; totalSum += e.amount; });
    
    const sortedCats = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a]);
    const chartData = sortedCats.map((cat, index) => {
      const val = catTotals[cat];
      return { name: cat, population: val, color: index < COLOR_PALETTE.length ? COLOR_PALETTE[index] : FALLBACK_COLOR, percentage: ((val / totalSum) * 100).toFixed(0) + '%' };
    });
    
    return { type: 'chart', text: "Spending Breakdown", data: chartData, totalSum };
  };

  const handleAnalysisCommand = () => {
    const expenseList = expenses.filter(e => e.type === 'expense' || !e.type);
    if (expenseList.length === 0) return { type: 'text', text: "No data to analyze." };
    const max = expenseList.reduce((p, c) => (p.amount > c.amount) ? p : c);
    return { type: 'text', text: `🏆 Biggest Expense: **${max.name}** (${currency}${max.amount})` };
  };

  const sendMessage = (customText = null) => {
    const msgText = customText || input;
    if (!msgText.trim()) return;
    
    const userMsg = { id: Date.now().toString(), type: 'text', text: msgText, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    
    setTimeout(() => {
      const reply = processCommand(msgText);
      const botMsg = { id: (Date.now() + 1).toString(), ...reply, sender: 'bot', timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
      setLoading(false);
    }, 600);
  };

  const handleTryCommand = (cmdText) => {
      setShowHelpModal(false);
      setInput(cmdText);
      setTimeout(() => {
          inputRef.current?.focus();
      }, 300);
  };

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  const formatText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) return <Text key={index} style={{fontWeight: 'bold'}}>{part.replace(/\*\*/g, '')}</Text>;
      return part;
    });
  };

  const renderBubble = ({ item }) => {
    const isBot = item.sender === 'bot';
    const isChart = item.type === 'chart';

    return (
      <View style={[styles.messageWrapper, isBot ? styles.messageWrapperBot : styles.messageWrapperUser, isChart && { maxWidth: '95%' }]}>
        {isBot && !isChart && ( <Avatar.Icon size={32} icon="robot" color="#FFF" style={[styles.botAvatar, { backgroundColor: colors.primary }]} /> )}
        {isBot && isChart && ( <Avatar.Icon size={32} icon="chart-pie" color="#FFF" style={[styles.botAvatar, { backgroundColor: colors.primary }]} /> )}

        <Surface style={[
          styles.bubble, 
          { backgroundColor: isBot ? colors.surface : colors.primary },
          isBot ? { borderBottomLeftRadius: 4 } : { borderBottomRightRadius: 4 },
          isChart && styles.chartBubble
        ]} elevation={isBot ? 1 : 0}>
          
          {item.type === 'text' && ( <Text style={[styles.msgText, { color: isBot ? colors.text : '#FFF' }]}>{formatText(item.text)}</Text> )}
          {isChart && ( <AnimatedChartBubble item={item} colors={colors} currency={currency} /> )}

          {isBot && item.showUndo && ( 
            <TouchableOpacity onPress={() => sendMessage('Undo')} style={styles.undoBtn}>
              <Text style={{color: colors.primary, fontWeight: '700', fontSize: 13}}>Undo</Text>
            </TouchableOpacity> 
          )}

          {!isChart && ( <Text style={[styles.timestamp, { color: isBot ? colors.textSec : 'rgba(255,255,255,0.7)' }]}> {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} </Text> )}
        </Surface>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      
      {/* ✨ RENDER THE EXTRACTED COMPONENT */}
      <FinBotHelpModal visible={showHelpModal} onClose={() => setShowHelpModal(false)} onTryCommand={handleTryCommand} colors={colors} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <IconButton icon="arrow-left" size={24} iconColor={colors.text} style={{margin: 0}} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>FinBot AI</Text>
            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 2}}>
              <View style={[styles.onlineDot, { backgroundColor: '#00C853' }]} />
              <Text style={{color: colors.success, fontSize: 11, fontWeight: '600', marginLeft: 4}}>Online</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity onPress={() => setShowHelpModal(true)}>
            <Surface style={[styles.helpBtn, { backgroundColor: colors.surface }]} elevation={2}>
                <IconButton icon="help" size={20} iconColor={colors.primary} style={{margin: 0}} />
            </Surface>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList ref={flatListRef} data={messages} keyExtractor={item => item.id} contentContainerStyle={styles.chatContainer} showsVerticalScrollIndicator={false} renderItem={renderBubble} />

        {loading && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{color: colors.textSec, marginLeft: 8, fontSize: 12}}>Thinking...</Text>
          </View>
        )}
        
        <View style={styles.suggestionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, alignItems: 'center' }}>
            {suggestions.map((chip, index) => (
              <TouchableOpacity key={index} style={[styles.chip, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]} onPress={() => sendMessage(chip.cmd)}>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput ref={inputRef} style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg || colors.background, borderColor: colors.border }]} placeholder="Type: 'Lunch 200'" placeholderTextColor={colors.textSec} value={input} onChangeText={setInput} onSubmitEditing={() => sendMessage()} returnKeyType="send" />
          <TouchableOpacity onPress={() => sendMessage()} disabled={!input.trim()}>
            <View style={[styles.sendButton, { backgroundColor: input.trim() ? colors.primary : colors.border }]}>
              <IconButton icon="send" size={18} iconColor={input.trim() ? '#FFFFFF' : colors.textSec} style={{margin: 0}} />
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 1 },
  iconBtn: { padding: 5 },
  headerTitleContainer: { alignItems: 'flex-start', marginLeft: 5 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  helpBtn: { borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginRight: 5 },
  
  chatContainer: { padding: 15, paddingBottom: 20 },
  messageWrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 15, maxWidth: '85%' },
  messageWrapperUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  messageWrapperBot: { alignSelf: 'flex-start' },
  botAvatar: { marginRight: 8, marginBottom: 5 },
  bubble: { padding: 14, borderRadius: 20, maxWidth: '100%' },
  chartBubble: { padding: 20, borderRadius: 24, width: '100%' }, 
  msgText: { fontSize: 15, lineHeight: 22 },
  timestamp: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },
  undoBtn: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: 'rgba(0,0,0,0.05)', alignSelf: 'flex-start', borderRadius: 14 },
  
  chartTitle: { fontSize: 17, fontWeight: '700', marginBottom: 15, textAlign: 'center' },
  donutContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 15, alignSelf: 'center' },
  donutHole: { position: 'absolute', alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 10 },
  chartHint: { textAlign: 'center', fontSize: 11, marginBottom: 15, fontStyle: 'italic' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  
  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 },
  suggestionsContainer: { height: 44, marginBottom: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 15, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 24, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, fontSize: 15, borderWidth: 1, maxHeight: 100 },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});