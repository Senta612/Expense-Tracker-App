// src/components/ExpenseForm.js
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Button, Text, IconButton, Surface } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import AmountInput from './AmountInput';

const ExpenseForm = ({ initialData, onSaveData, colors, currency, categories, paymentModes, upiApps, availableBalance }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [category, setCategory] = useState(initialData?.category || categories[0] || 'Food');
    const [paymentMode, setPaymentMode] = useState(initialData?.paymentMode || paymentModes[0] || 'UPI');
    const [paymentApp, setPaymentApp] = useState(initialData?.paymentApp || null);
    const [description, setDescription] = useState(initialData?.description || '');
    const [date, setDate] = useState(initialData ? new Date(initialData.date) : new Date());

    const [spreadDays, setSpreadDays] = useState('1');
    const [showPicker, setShowPicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const enteredAmount = parseFloat(amount) || 0;
    const remainingAfter = availableBalance - enteredAmount;

    const handleSave = () => {
        if (!name || !amount) { onSaveData({ error: "Enter Title & Amount" }); return; }
        setIsSaving(true);

        const days = parseInt(spreadDays) || 1;
        const totalAmount = parseFloat(amount);

        if (days > 1 && !initialData) {
            const splitAmount = totalAmount / days;
            const payloads = [];

            for (let i = 0; i < days; i++) {
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + i);

                payloads.push({
                    id: Date.now().toString() + '-' + i,
                    type: 'expense',
                    name: `${name} (Day ${i + 1}/${days})`,
                    amount: parseFloat(splitAmount.toFixed(2)),
                    category,
                    description,
                    date: nextDate.toISOString(),
                    paymentMode,
                    paymentApp: paymentMode === 'UPI' ? paymentApp : null,
                });
            }
            onSaveData({ payload: payloads, resetLoading: () => setIsSaving(false) });
        } else {
            const payload = {
                id: initialData ? initialData.id : Date.now().toString(),
                type: 'expense',
                name, amount: totalAmount, category, description,
                date: date.toISOString(), paymentMode,
                paymentApp: paymentMode === 'UPI' ? paymentApp : null,
            };
            onSaveData({ payload, resetLoading: () => setIsSaving(false) });
        }
    };

    const Label = ({ icon, text }) => (
        <View style={styles.labelRow}>
            <IconButton icon={icon} size={18} iconColor={colors.textSec} style={{ margin: 0, marginRight: 5 }} />
            <Text style={[styles.label, { color: colors.textSec }]}>{text}</Text>
        </View>
    );

    return (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <AmountInput amount={amount} setAmount={setAmount} currency={currency} isIncome={false} color={colors.error} />

            <View style={styles.liveCalc}>
                <Text style={{ color: colors.textSec }}>Balance: {currency}{availableBalance.toLocaleString('en-IN')}</Text>
                <Text style={{ color: colors.textSec }}> → </Text>
                <Text style={{ color: colors.error, fontWeight: 'bold' }}>After: {currency}{remainingAfter.toLocaleString('en-IN')}</Text>
            </View>

            <Surface style={[styles.formSection, { backgroundColor: colors.surface }]}>
                <Label icon="format-title" text="Expense Title" />
                <TextInput style={[styles.simpleInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="e.g. Petrol, Groceries" placeholderTextColor={colors.textSec} value={name} onChangeText={setName} />

                <Label icon="shape-outline" text="Category" />
                <View style={styles.chipWrapContainer}>
                    {categories.map((cat) => (
                        <TouchableOpacity key={`exp-cat-${cat}`} onPress={() => setCategory(cat)} style={[styles.chip, category === cat ? { backgroundColor: colors.primary } : { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}>
                            <Text style={[styles.chipText, category === cat ? { color: '#FFF' } : { color: colors.text }]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Label icon="credit-card-outline" text="Payment Method" />
                <View style={styles.chipWrapContainer}>
                    {paymentModes.map((mode) => (
                        <TouchableOpacity key={`exp-mode-${mode}`} onPress={() => { setPaymentMode(mode); setPaymentApp(null); }} style={[styles.chip, paymentMode === mode ? { backgroundColor: colors.primary } : { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}>
                            <Text style={[styles.chipText, paymentMode === mode ? { color: '#FFF' } : { color: colors.text }]}>{mode}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {paymentMode === 'UPI' && upiApps && upiApps.length > 0 && (
                    <View style={styles.subOptionContainer}>
                        <View style={styles.chipWrapContainer}>
                            {upiApps.map((app) => (
                                <TouchableOpacity key={`exp-app-${app}`} onPress={() => setPaymentApp(app === paymentApp ? null : app)} style={[styles.miniChip, paymentApp === app ? { backgroundColor: colors.chip, borderColor: colors.primary } : { borderColor: colors.border }]}>
                                    <Text style={[styles.miniChipText, paymentApp === app ? { color: colors.text, fontWeight: 'bold' } : { color: colors.textSec }]}>{app}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                <Label icon="calendar-month-outline" text="Start Date" />
                <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.dateRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Text style={[styles.dateText, { color: colors.text }]}>{date.toDateString()}</Text>
                    <IconButton icon="calendar" size={20} iconColor={colors.text} />
                </TouchableOpacity>
                {showPicker && (<DateTimePicker value={date} mode="date" display="default" onChange={(e, d) => { setShowPicker(false); if (d) setDate(d); }} />)}

                {!initialData && (
                    <>
                        <Label icon="arrow-expand-horizontal" text="Spread Over Multiple Days?" />
                        <View style={[styles.dateRow, { backgroundColor: colors.inputBg, borderColor: colors.border, paddingVertical: 4 }]}>
                            <IconButton
                                icon="minus"
                                size={20}
                                iconColor={colors.primary}
                                onPress={() => setSpreadDays(prev => Math.max(1, parseInt(prev || 1) - 1).toString())}
                            />
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
                                {spreadDays} {parseInt(spreadDays) === 1 ? 'Day' : 'Days'}
                            </Text>
                            <IconButton
                                icon="plus"
                                size={20}
                                iconColor={colors.primary}
                                onPress={() => setSpreadDays(prev => (parseInt(prev || 1) + 1).toString())}
                            />
                        </View>

                        {parseInt(spreadDays) > 1 && enteredAmount > 0 && (
                            <Text style={{ fontSize: 12, color: colors.textSec, marginTop: 6, fontStyle: 'italic', textAlign: 'center' }}>
                                This will log {currency}{(enteredAmount / parseInt(spreadDays)).toFixed(2)} per day for {spreadDays} days.
                            </Text>
                        )}
                    </>
                )}

                <Label icon="note-text-outline" text="Description (Optional)" />
                <TextInput style={[styles.simpleInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, height: 60, textAlignVertical: 'top' }]} placeholder="Add notes..." placeholderTextColor={colors.textSec} value={description} onChangeText={setDescription} multiline />

                <Button mode="contained" onPress={handleSave} loading={isSaving} style={[styles.saveBtn, { backgroundColor: colors.error }]} textColor="#FFF" labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>
                    {isSaving ? "Saving..." : "Save Expense"}
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
    subOptionContainer: { marginTop: 5, marginBottom: 5 },
    miniChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, marginRight: 8, marginBottom: 8 },
    miniChipText: { fontSize: 12 },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
    dateText: { fontSize: 15, fontWeight: '500' },
    saveBtn: { marginTop: 30, paddingVertical: 6, borderRadius: 16, elevation: 2, marginBottom: 20 },
});

export default ExpenseForm;