import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Keyboard, ActivityIndicator } from 'react-native';
import { Text, IconButton, Surface, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';

export default function ChatScreen({ navigation }) {
  const { expenses, currency, getBalanceData, colors, categories } = useExpenses();
  
  // Start with a default greeting
  const [messages, setMessages] = useState([
    { 
        id: '1', 
        text: "Hi there! I'm FinBot 🤖. I analyze your wallet locally. Ask me things like:\n\n• 'What is my total spending?'\n• 'How much did I spend on Food?'\n• 'What is my highest expense?'\n• 'What is my balance?'", 
        sender: 'bot', 
        timestamp: new Date() 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef();

  // --- 🧠 LOCAL AI LOGIC ENGINE ---
  const analyzeQuery = (query) => {
    const q = query.toLowerCase();
    
    // Only look at actual expenses for spending calculations
    const expenseList = expenses.filter(e => e.type === 'expense' || !e.type);
    const incomeList = expenses.filter(e => e.type === 'income');

    // 1. Balance Queries
    if (q.includes('balance') || q.includes('wallet') || q.includes('left')) {
        const { availableBalance } = getBalanceData();
        return `Your current available balance is **${currency}${availableBalance.toLocaleString('en-IN')}**.`;
    }

    // 2. Total Spending Queries
    if (q.includes('total spend') || q.includes('total spent') || q.includes('how much have i spent')) {
        const total = expenseList.reduce((sum, item) => sum + item.amount, 0);
        return `You have spent a total of **${currency}${total.toLocaleString('en-IN')}** across all categories.`;
    }

    // 3. Total Income Queries
    if (q.includes('income') || q.includes('earned') || q.includes('received')) {
        const totalInc = incomeList.reduce((sum, item) => sum + item.amount, 0);
        return `You have received a total of **${currency}${totalInc.toLocaleString('en-IN')}** in income.`;
    }

    // 4. Highest Expense Queries
    if (q.includes('highest') || q.includes('biggest') || q.includes('most expensive')) {
        if (expenseList.length === 0) return "You haven't recorded any expenses yet!";
        const highest = [...expenseList].sort((a, b) => b.amount - a.amount)[0];
        return `Your biggest expense was **${highest.name}** for **${currency}${highest.amount}** on ${new Date(highest.date).toDateString()}.`;
    }

    // 5. Category-Specific Queries (Dynamically checks your custom categories!)
    for (let cat of categories) {
        if (q.includes(cat.toLowerCase())) {
            const catTotal = expenseList.filter(e => e.category === cat).reduce((sum, item) => sum + item.amount, 0);
            if (catTotal === 0) return `You haven't spent anything on **${cat}** yet.`;
            return `You have spent a total of **${currency}${catTotal.toLocaleString('en-IN')}** on **${cat}**.`;
        }
    }

    // Fallback response
    return "I'm still learning! Try asking about your 'balance', 'total spending', 'highest expense', or a specific category like 'Food'.";
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage = { id: Date.now().toString(), text: inputText.trim(), sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking delay (600ms)
    setTimeout(() => {
        const botResponseText = analyzeQuery(userMessage.text);
        const botMessage = { id: (Date.now() + 1).toString(), text: botResponseText, sender: 'bot', timestamp: new Date() };
        
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
    }, 600);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isTyping]);

  // --- UI RENDERERS ---
  const formatText = (text) => {
      // Very simple markdown parser for bolding (**)
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
              return <Text key={index} style={{fontWeight: 'bold'}}>{part.replace(/\*\*/g, '')}</Text>;
          }
          return part;
      });
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperBot]}>
        {!isUser && (
            <Avatar.Icon size={30} icon="robot-outline" color="#FFF" style={{ backgroundColor: colors.accent || '#6200EE', marginRight: 8, marginBottom: 5 }} />
        )}
        <Surface style={[styles.messageBubble, { 
            backgroundColor: isUser ? colors.primary : colors.surface,
            borderBottomRightRadius: isUser ? 4 : 20,
            borderBottomLeftRadius: isUser ? 20 : 4,
        }]} elevation={isUser ? 0 : 1}>
          <Text style={[styles.messageText, { color: isUser ? '#FFF' : colors.text }]}>
              {formatText(item.text)}
          </Text>
          <Text style={[styles.timestamp, { color: isUser ? 'rgba(255,255,255,0.6)' : colors.textSec }]}>
              {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </Surface>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <IconButton icon="arrow-left" size={24} iconColor={colors.text} style={{margin: 0}} />
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
        
        {/* CHAT AREA */}
        <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatContainer}
            showsVerticalScrollIndicator={false}
        />

        {isTyping && (
            <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color={colors.accent || '#6200EE'} />
                <Text style={{color: colors.textSec, marginLeft: 8, fontSize: 12}}>FinBot is analyzing...</Text>
            </View>
        )}

        {/* INPUT AREA */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                placeholder="Ask about your spending..."
                placeholderTextColor={colors.textSec}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
            />
            <TouchableOpacity onPress={sendMessage} disabled={!inputText.trim()}>
                <View style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.primary : colors.inputBg }]}>
                    <IconButton icon="send" size={20} iconColor={inputText.trim() ? '#FFF' : colors.textSec} style={{margin:0}} />
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
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C853' },
  
  chatContainer: { padding: 15, paddingBottom: 20 },
  
  messageWrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 15, maxWidth: '85%' },
  messageWrapperUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  messageWrapperBot: { alignSelf: 'flex-start' },
  
  messageBubble: { padding: 12, borderRadius: 20 },
  messageText: { fontSize: 15, lineHeight: 22 },
  timestamp: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },

  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 15, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 24, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12, fontSize: 15, borderWidth: 1, maxHeight: 100 },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});