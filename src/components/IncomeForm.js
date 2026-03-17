// src/components/IncomeForm.js
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Button, Text, IconButton, Surface } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import AmountInput from './AmountInput';

const IncomeForm = ({ initialData, onSaveData, colors, currency, availableBalance }) => {
    const incomeFrequencies = ['One-time', 'Weekly', 'Monthly', 'Yearly'];

    const [name, setName] = useState(initialData?.name || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [paymentMode, setPaymentMode] = useState(initialData?.paymentMode || 'One-time');
    const [description, setDescription] = useState(initialData?.description || '');
    const [date, setDate] = useState(initialData ? new Date(initialData.date) : new Date());

    const [showPicker, setShowPicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const enteredAmount = parseFloat(amount) || 0;
    const remainingAfter = availableBalance + enteredAmount;

    const handleSave = () => {
        if (!name || !amount) { onSaveData({ error: "Enter Title & Amount" }); return; }
        setIsSaving(true);
        const payload = {
            id: initialData ? initialData.id : Date.now().toString(),
            type: 'income',
            name, amount: parseFloat(amount), category: 'Income', description,
            date: date.toISOString(), paymentMode, paymentApp: null,
        };
        onSaveData({ payload, resetLoading: () => setIsSaving(false) });
    };

    const Label = ({ icon, text }) => (
        <View style={styles.labelRow}>
            <IconButton icon={icon} size={18} iconColor={colors.textSec} style={{ margin: 0, marginRight: 5 }} />
            <Text style={[styles.label, { color: colors.textSec }]}>{text}</Text>
        </View>
    );

    return (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <AmountInput amount={amount} setAmount={setAmount} currency={currency} isIncome={true} color="#00C853" />

            <View style={styles.liveCalc}>
                <Text style={{ color: colors.textSec }}>Balance: {currency}{availableBalance.toLocaleString('en-IN')}</Text>
                <Text style={{ color: colors.textSec }}> → </Text>
                <Text style={{ color: '#00C853', fontWeight: 'bold' }}>After: {currency}{remainingAfter.toLocaleString('en-IN')}</Text>
            </View>

            <Surface style={[styles.formSection, { backgroundColor: colors.surface }]}>
                <Label icon="format-title" text="Income Source" />
                <TextInput style={[styles.simpleInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="e.g. Salary, Freelance, Gift" placeholderTextColor={colors.textSec} value={name} onChangeText={setName} />

                <Label icon="calendar-sync" text="Income Frequency" />
                <View style={styles.chipWrapContainer}>
                    {incomeFrequencies.map((mode) => (
                        <TouchableOpacity key={`inc-mode-${mode}`} onPress={() => setPaymentMode(mode)} style={[styles.chip, paymentMode === mode ? { backgroundColor: colors.primary } : { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}>
                            <Text style={[styles.chipText, paymentMode === mode ? { color: '#FFF' } : { color: colors.text }]}>{mode}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Label icon="calendar-month-outline" text="Date Received" />
                <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.dateRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Text style={[styles.dateText, { color: colors.text }]}>{date.toDateString()}</Text>
                    <IconButton icon="calendar" size={20} iconColor={colors.text} />
                </TouchableOpacity>
                {showPicker && (<DateTimePicker value={date} mode="date" display="default" onChange={(e, d) => { setShowPicker(false); if (d) setDate(d); }} />)}

                <Label icon="note-text-outline" text="Notes (Optional)" />
                <TextInput style={[styles.simpleInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, height: 60, textAlignVertical: 'top' }]} placeholder="Add notes..." placeholderTextColor={colors.textSec} value={description} onChangeText={setDescription} multiline />

                <Button mode="contained" onPress={handleSave} loading={isSaving} style={[styles.saveBtn, { backgroundColor: '#00C853' }]} textColor="#FFF" labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>
                    {isSaving ? "Saving..." : "Add to Wallet"}
                </Button>
            </Surface>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: { flexGrow: 1, paddingBottom: 20 },
    liveCalc: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
    formSection: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40, elevation: 4 },
    labelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 5 },
    label: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' },
    simpleInput: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1, marginBottom: 5 },
    chipWrapContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 5 },
    chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 24, marginBottom: 8, marginRight: 8 },
    chipText: { fontSize: 13, fontWeight: '600' },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
    dateText: { fontSize: 15, fontWeight: '500' },
    saveBtn: { marginTop: 30, paddingVertical: 6, borderRadius: 16, elevation: 2, marginBottom: 20 },
});

export default IncomeForm;