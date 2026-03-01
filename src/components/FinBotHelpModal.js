// src/components/FinBotHelpModal.js
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Modal, ScrollView, Dimensions } from 'react-native';
import { Text, IconButton, Avatar } from 'react-native-paper';

const { height: screenHeight } = Dimensions.get('window');

const FinBotHelpModal = ({ visible, onClose, onTryCommand, colors }) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: screenHeight, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const tutorials = [
    { icon: "flash", title: "Quick Logging", desc: "Just state what you bought and the amount.", cmd: "Coffee 150" },
    { icon: "brain", title: "Advanced Details", desc: "Add payment mode, dates, and notes.", cmd: "Paid 800 for Shoes via GPay note Diwali sale" },
    { icon: "cash-plus", title: "Add Income", desc: "Log money you received effortlessly.", cmd: "Got 5000 salary last Friday" },
    { icon: "pencil-ruler", title: "Quick Edits", desc: "Made a mistake? Just tell FinBot.", cmd: "Change last amount to 500" },
    { icon: "chart-pie", title: "Instant Reports", desc: "Ask for insights at any time.", cmd: "Show chart" }
  ];

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[styles.helpSheet, { backgroundColor: colors.surface, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sheetHandle} />
          
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 20}}>
            <Avatar.Icon size={40} icon="robot-outline" style={{ backgroundColor: colors.primary + '20', marginRight: 15 }} color={colors.primary} />
            <View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>FinBot AI Guide</Text>
              <Text style={{ fontSize: 13, color: colors.textSec }}>Learn how to chat like a pro.</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
            {tutorials.map((item, index) => (
              <View key={index} style={[styles.tutorialCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <IconButton icon={item.icon} size={24} iconColor={colors.primary} style={{ margin: 0, marginTop: 2, marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{item.title}</Text>
                    <Text style={{ fontSize: 13, color: colors.textSec, marginTop: 2, marginBottom: 10 }}>{item.desc}</Text>
                    <View style={[styles.codeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={{ color: colors.text, fontSize: 13, fontStyle: 'italic', flex: 1 }}>{item.cmd}</Text>
                      <TouchableOpacity onPress={() => onTryCommand(item.cmd)}>
                        <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 13 }}>TRY IT</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  helpSheet: { width: '100%', maxHeight: screenHeight * 0.8, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 15, paddingBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.2)', alignSelf: 'center', marginBottom: 20 },
  tutorialCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  codeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 }
});

export default FinBotHelpModal;