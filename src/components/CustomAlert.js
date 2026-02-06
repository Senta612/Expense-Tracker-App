import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useExpenses } from '../context/ExpenseContext';

export default function CustomAlert() {
  const { alertConfig, closeAlert, colors } = useExpenses();
  const { visible, title, msg, onConfirm } = alertConfig;

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <Surface style={[styles.dialog, { backgroundColor: colors.surface }]} elevation={5}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSec }]}>{msg}</Text>
          
          <View style={styles.actions}>
            {/* Cancel Button (Only if onConfirm exists) */}
            {onConfirm && (
                <Button 
                    mode="outlined" 
                    onPress={closeAlert} 
                    textColor={colors.textSec}
                    style={[styles.btn, { borderColor: colors.border }]}
                >
                    Cancel
                </Button>
            )}

            {/* OK / Confirm Button */}
            <Button 
                mode="contained" 
                onPress={() => {
                    if (onConfirm) onConfirm();
                    closeAlert();
                }} 
                buttonColor={onConfirm ? colors.error : colors.primary} // Red if Destructive, Blue/Black if Info
                textColor="#FFF"
                style={styles.btn}
            >
                {onConfirm ? "Confirm" : "OK"}
            </Button>
          </View>
        </Surface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 340, padding: 24, borderRadius: 24 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  message: { fontSize: 16, lineHeight: 22, marginBottom: 24 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btn: { borderRadius: 12, minWidth: 80 }
});