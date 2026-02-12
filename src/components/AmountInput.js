import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';

export default function AmountInput({ amount, setAmount, currency, isIncome, color }) {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: color }]}>
        {isIncome ? 'RECEIVING' : 'SPENDING'}
      </Text>
      
      <View style={styles.inputRow}>
        <Text style={[styles.currency, { color: color }]}>{currency}</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#ddd"
          style={[styles.input, { color: color }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 5, opacity: 0.7 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  currency: { fontSize: 32, fontWeight: 'bold', marginRight: 5 },
  input: { fontSize: 48, fontWeight: '800', minWidth: 60, textAlign: 'center' },
});