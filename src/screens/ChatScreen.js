import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, ScrollView, ActivityIndicator, Animated } from 'react-native';
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

// Premium 10-color palette for top 10 categories (by rank)
const COLOR_PALETTE = [
  '#6B52FF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', 
  '#96CEB4', '#DDA0DD', '#42A5F5', '#FF7043', '#26A69A'
];

const FALLBACK_COLOR = '#B0BEC5';

// --- 1. PREMIUM LEGEND ANIMATION COMPONENT ---
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
        {/* ✨ Ensured text strictly uses the dynamic theme colors */}
        <Text style={{ fontSize: 15, color: '#FFFFFF', fontWeight: '600' }}>{d.name}</Text>

      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>-{currency}{d.population.toLocaleString('en-IN')}</Text>
        <Text style={{ fontSize: 12, color: colors.textSec, marginTop: 2, fontWeight: '500' }}>{d.percentage}</Text>
      </View>
    </Animated.View>
  );
};

// --- 2. PREMIUM DONUT CHART BUBBLE COMPONENT ---
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

  // ✨ We dynamically map the data AT RENDER TIME so it immediately switches colors if user toggles Dark Mode
  const dynamicChartData = item.data.map(d => ({
    ...d,
    legendFontColor: colors.text,
    legendFontSize: 12
  }));

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], width: '100%' }}>
      <Text style={[styles.chartTitle, { color: '#FFFFFF' }]}>Spending Breakdown</Text>



      {/* DONUT CONTAINER */}
      <View style={[styles.donutContainer, { width: chartSize, height: chartSize, aspectRatio: 1 }]}>
        <PieChart 
          data={dynamicChartData} 
          width={chartSize + 60} // Added width buffer so it doesn't clip
          height={chartSize} 
          hasLegend={false}
          // ✨ FIX: Dynamic text colors instead of hardcoded black
          chartConfig={{ 
            color: (opacity = 1) => colors.text,
            labelColor: (opacity = 1) => colors.text 
          }} 
          accessor={"population"} 
          backgroundColor={"transparent"} 
          paddingLeft={"30"} // Centers the pie perfectly
          // ✨ FIX: `absolute` has been removed here to hide the black overlapping numbers
        />
        
        {/* DONUT HOLE - Uses strictly colors.surface and colors.text */}
        <View style={[styles.donutHole, { backgroundColor: colors.surface, width: donutHoleSize, height: donutHoleSize, borderRadius: donutHoleSize / 2 }]}>
          <Text style={{ fontSize: 8, color: '#FFFFFF', fontWeight: '700', letterSpacing: 1 }}>TOTAL</Text>
          <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFFFFF', marginTop: 2 }}>{currency}{item.totalSum.toLocaleString('en-IN')}</Text>
        </View>


      </View>

      <Text style={[styles.chartHint, { color: colors.textSec }]}>Tap a category below</Text>

      {/* CASCADING LEGEND LIST */}
      <View style={{ width: '100%' }}>
        {item.data.map((d, i) => (
          <LegendItem key={d.name} d={d} index={i} colors={colors} currency={currency} />
        ))}
      </View>
    </Animated.View>
  );
};


export default function ChatScreen({ navigation }) {
  const { colors, addExpense, deleteExpense, categories, paymentModes, upiApps, currency, getFilteredExpenses, expenses } = useExpenses();
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastAddedId, setLastAddedId] = useState(null);
  const flatListRef = useRef();
  const inputRef = useRef();

  const [messages, setMessages] = useState([
    { id: '1', type: 'text', text: "Hi! I'm FinBot. Tell me 'Lunch 250' or 'Uber 100'.", sender: 'bot', timestamp: new Date() }
  ]);
  
  const suggestions = [
    { label: "Today's Summary", cmd: "Show today's summary" },
    { label: "Yesterday Lunch 150", cmd: "Yesterday Lunch 150" },
    { label: "Petrol 500", cmd: "Petrol 500" },
    { label: "Show Chart", cmd: "Show chart" },
  ];

  const processCommand = (text) => {
    const lower = text.toLowerCase();
    if (lower === 'undo' && lastAddedId) { 
      deleteExpense(lastAddedId); 
      setLastAddedId(null); 
      return { type: 'text', text: "Done! I removed that entry." }; 
    }
    if (lower.match(/\d+/) && (lower.includes('add') || lower.includes('spent') || isCategoryKeyword(lower) || lower.includes('yesterday'))) {
      return handleAddCommand(text, lower);
    }
    if (lower.includes('summary') || lower.includes('total')) return handleSummaryCommand(lower);
    if (lower.includes('chart') || lower.includes('graph')) return handleChartCommand();
    if (lower.includes('biggest') || lower.includes('highest')) return handleAnalysisCommand();
    
    return { type: 'text', text: "Try 'Lunch 150' or 'Show Chart'." };
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
    
    let paymentMode = 'Cash'; 
    let paymentApp = null;
    upiApps.forEach(app => { if (lower.includes(app.toLowerCase())) { paymentMode = 'UPI'; paymentApp = app; }});
    if (!paymentApp) { paymentModes.forEach(mode => { if (lower.includes(mode.toLowerCase())) paymentMode = mode; }); }

    let cleanDesc = originalText.replace(amountMatch[0], '').replace(/yesterday|add|spent|paid|bought|via|on|for/gi, '').replace(new RegExp(category, 'gi'), '').replace(new RegExp(paymentMode, 'gi'), '').replace(new RegExp(paymentApp || '', 'gi'), '').trim();
    const finalTitle = cleanDesc.length > 1 ? cleanDesc : (detectedKeyword ? detectedKeyword.charAt(0).toUpperCase() + detectedKeyword.slice(1) : category);
    
    const newId = Date.now().toString();
    addExpense({ id: newId, type: 'expense', name: finalTitle, amount, category, description: `Bot Entry: ${originalText}`, date: date.toISOString(), paymentMode, paymentApp});
    setLastAddedId(newId);
    
    return { type: 'text', text: `Done! Added ${currency}${amount} for ${category}.`, showUndo: true };
  };

  const handleSummaryCommand = (lower) => {
    let target = lower.includes('today') ? 'Today' : lower.includes('week') ? 'Week' : 'All';
    const total = getFilteredExpenses(target).reduce((sum, item) => sum + item.amount, 0);
    return { type: 'text', text: `${target} Total: ${currency}${total.toLocaleString('en-IN')}` };
  };

  const handleChartCommand = () => {
    const expenseList = expenses.filter(e => e.type === 'expense' || !e.type);
    if (expenseList.length === 0) return { type: 'text', text: "No data yet!" };

    const catTotals = {}; 
    let totalSum = 0;
    expenseList.forEach(e => { 
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; 
      totalSum += e.amount;
    });
    
    const sortedCats = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a]);
    
    const chartData = sortedCats.map((cat, index) => {
      const val = catTotals[cat];
      return { 
        name: cat, 
        population: val, 
        color: index < COLOR_PALETTE.length ? COLOR_PALETTE[index] : FALLBACK_COLOR, 
        percentage: ((val / totalSum) * 100).toFixed(0) + '%'
      };
    });
    
    return { type: 'chart', text: "Spending Breakdown", data: chartData, totalSum };
  };

  const handleAnalysisCommand = () => {
    const expenseList = expenses.filter(e => e.type === 'expense' || !e.type);
    if (expenseList.length === 0) return { type: 'text', text: "No data to analyze." };
    const max = expenseList.reduce((p, c) => (p.amount > c.amount) ? p : c);
    return { type: 'text', text: `Biggest Expense: ${max.name} (${currency}${max.amount})` };
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
        
        {isBot && !isChart && (
          <Avatar.Icon size={32} icon="robot" color="#FFF" style={[styles.botAvatar, { backgroundColor: colors.primary }]} />
        )}
        {isBot && isChart && (
          <Avatar.Icon size={32} icon="chart-pie" color="#FFF" style={[styles.botAvatar, { backgroundColor: colors.primary }]} />
        )}

        <Surface style={[
          styles.bubble, 
          { backgroundColor: isBot ? colors.surface : colors.primary },
          isBot ? { borderBottomLeftRadius: 4 } : { borderBottomRightRadius: 4 },
          isChart && styles.chartBubble
        ]} elevation={isBot ? 1 : 0}>
          
          {item.type === 'text' && (
            <Text style={[styles.msgText, { color: isBot ? colors.text : '#FFF' }]}>{formatText(item.text)}</Text>
          )}

          {isChart && (
            <AnimatedChartBubble item={item} colors={colors} currency={currency} />
          )}

          {isBot && item.showUndo && ( 
            <TouchableOpacity onPress={() => sendMessage('Undo')} style={styles.undoBtn}>
              <Text style={{color: colors.primary, fontWeight: '700', fontSize: 13}}>Undo</Text>
            </TouchableOpacity> 
          )}

          {!isChart && (
            <Text style={[styles.timestamp, { color: isBot ? colors.textSec : 'rgba(255,255,255,0.7)' }]}>
              {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </Surface>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <IconButton icon="arrow-left" size={24} iconColor={colors.text} style={{margin: 0}} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>FinBot</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 2}}>
            <View style={[styles.onlineDot, { backgroundColor: '#00C853' }]} />
            <Text style={{color: colors.success, fontSize: 11, fontWeight: '600', marginLeft: 4}}>Online</Text>
          </View>
        </View>
        <View style={{width: 40}} /> 
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          renderItem={renderBubble}
        />

        {loading && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{color: colors.textSec, marginLeft: 8, fontSize: 12}}>Thinking...</Text>
          </View>
        )}
        
        <View style={styles.suggestionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, alignItems: 'center' }}>
            {suggestions.map((chip, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.chip, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]} 
                onPress={() => sendMessage(chip.cmd)}
              >
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg || colors.background, borderColor: colors.border }]}
            placeholder="Type: 'Lunch 200'"
            placeholderTextColor={colors.textSec}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
          />
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
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  
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
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});