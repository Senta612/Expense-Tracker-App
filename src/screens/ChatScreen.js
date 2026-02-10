import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Text, Surface, IconButton, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../context/ExpenseContext';

export default function ChatScreen({ navigation }) {
  const { 
    colors, expenses, addExpense, categories, paymentModes, upiApps, 
    currency, getFilteredExpenses 
  } = useExpenses();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: "Hi! I'm FinBot 🤖. Tell me to 'Add 100 for Food' or ask 'How much did I spend today?'", sender: 'bot' }
  ]);
  const flatListRef = useRef();

  // --- BRAIN: PROCESS COMMANDS ---
  const processCommand = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('add') || lower.includes('spent') || lower.includes('paid')) return handleAddCommand(text, lower);
    if (lower.includes('summary') || lower.includes('total')) return handleSummaryCommand(lower);
    if (lower.includes('big') || lower.includes('highest')) return handleAnalysisCommand();
    return "I didn't catch that. Try 'Add 500 for Fuel' or 'Show today's total'.";
  };

  // --- HELPERS ---
  const handleAddCommand = (originalText, lower) => {
    try {
        const amountMatch = originalText.match(/\d+(\.\d+)?/);
        if (!amountMatch) return "I couldn't find an amount.";
        const amount = parseFloat(amountMatch[0]);

        let category = 'Other';
        categories.forEach(cat => { if (lower.includes(cat.toLowerCase())) category = cat; });

        let paymentMode = 'Cash'; 
        let paymentApp = null;
        upiApps.forEach(app => { if (lower.includes(app.toLowerCase())) { paymentMode = 'UPI'; paymentApp = app; }});
        
        let date = new Date();
        if (lower.includes('yesterday')) date.setDate(date.getDate() - 1);

        let cleanDesc = originalText.replace(amount.toString(), '').replace(/add|spent|paid|buy|for|on/gi, '').trim();

        addExpense({
            id: Date.now().toString(),
            name: cleanDesc || category, 
            amount, category, description: `FinBot: ${originalText}`,
            date: date.toISOString(), paymentMode, paymentApp
        });
        return `✅ Done! Added ${currency}${amount} for ${category}.`;
    } catch (e) { return "Oops, something went wrong."; }
  };

  const handleSummaryCommand = (lower) => {
    let target = lower.includes('today') ? 'Today' : lower.includes('week') ? 'Week' : 'All';
    const filtered = getFilteredExpenses(target);
    const total = filtered.reduce((sum, item) => sum + item.amount, 0);
    return `📊 ${target} Summary: ${currency}${total}`;
  };

  const handleAnalysisCommand = () => {
    if (expenses.length === 0) return "No data yet!";
    const max = expenses.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
    return `🏆 Biggest Expense: ${max.name} (${currency}${max.amount})`;
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTimeout(() => {
        const replyText = processCommand(userMsg.text);
        const botMsg = { id: (Date.now() + 1).toString(), text: replyText, sender: 'bot' };
        setMessages(prev => [...prev, botMsg]);
    }, 600);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      
      {/* 1. Header (Stays Fixed at Top) */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <IconButton icon="arrow-left" size={24} iconColor={colors.text} />
        </TouchableOpacity>
        <Avatar.Icon size={40} icon="robot" style={{ backgroundColor: colors.primary, marginRight: 10 }} color="#FFF" />
        <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>FinBot AI</Text>
            <Text style={[styles.status, { color: colors.success }]}>● Online</Text>
        </View>
      </View>

      {/* 2. Keyboard Wrapper (Takes remaining space) */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={{ flex: 1 }}>
            {/* 3. Chat List (Takes all available space above input) */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => {
                    const isBot = item.sender === 'bot';
                    return (
                        <View style={[styles.bubbleWrapper, isBot ? { alignSelf: 'flex-start' } : { alignSelf: 'flex-end' }]}>
                            <Surface style={[
                                styles.bubble, 
                                isBot ? { backgroundColor: colors.surface, borderBottomLeftRadius: 0 } 
                                    : { backgroundColor: colors.primary, borderBottomRightRadius: 0 }
                            ]} elevation={1}>
                                <Text style={[styles.msgText, { color: isBot ? colors.text : '#FFF' }]}>{item.text}</Text>
                            </Surface>
                        </View>
                    );
                }}
            />
        </View>

        {/* 4. Input Area (Sticks to bottom) */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg }]}
                placeholder="Ask me anything..."
                placeholderTextColor={colors.textSec}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
            />
            <IconButton 
                icon="send" 
                size={24} 
                iconColor={colors.primary} 
                onPress={sendMessage}
                style={{ backgroundColor: colors.inputBg }}
            />
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, height: 70 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  status: { fontSize: 12, fontWeight: '600' },
  
  bubbleWrapper: { marginBottom: 15, maxWidth: '80%' },
  bubble: { padding: 12, borderRadius: 16 },
  msgText: { fontSize: 15, lineHeight: 22 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1 },
  input: { flex: 1, height: 45, borderRadius: 24, paddingHorizontal: 20, fontSize: 16, marginRight: 10 },
});