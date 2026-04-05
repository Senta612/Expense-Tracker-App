// src/components/FinBotHelpModal.js
import React, { useRef, useEffect } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Animated,
  Modal, ScrollView, Dimensions
} from 'react-native';
import { Text, IconButton, Avatar } from 'react-native-paper';

const { height: screenHeight } = Dimensions.get('window');

// ─────────────────────────────────────────────
//  TUTORIAL DATA  (covers all 7 command groups)
// ─────────────────────────────────────────────
const TUTORIALS = [
  {
    icon: 'flash',
    title: 'Quick Logging',
    desc: 'Just state what you bought and the amount. FinBot figures out the rest.',
    examples: [
      { label: 'Simple', cmd: 'Coffee 150' },
      { label: 'Detailed', cmd: 'Paid 800 for Shoes via GPay note Diwali sale' },
    ],
    badge: 'SMART ADD',
    badgeColor: '#6B52FF',
  },
  {
    icon: 'cash-plus',
    title: 'Add Income',
    desc: 'Log any money you received — salary, freelance, refunds, gifts.',
    examples: [
      { label: 'Salary', cmd: 'Got 5000 salary last Friday' },
      { label: 'Refund', cmd: 'Received 300 refund from Amazon' },
    ],
    badge: 'INCOME',
    badgeColor: '#00C853',
  },
  {
    icon: 'trash-can-outline',
    title: 'Bulk Delete',
    desc: 'Remove multiple transactions at once by keyword or date. FinBot confirms before deleting 3 or more.',
    examples: [
      { label: 'Keyword + date', cmd: 'Delete petrol from yesterday' },
      { label: 'Category', cmd: 'Remove my food expenses today' },
    ],
    badge: 'BULK DELETE',
    badgeColor: '#FF5252',
  },
  {
    icon: 'scale-balance',
    title: 'Budget Rebalancing',
    desc: 'Over budget in one category? FinBot finds surplus elsewhere and offers a one-tap fix.',
    examples: [
      { label: 'Auto-detect', cmd: 'Rebalance my budget' },
      { label: 'Check', cmd: 'Balance my budget' },
    ],
    badge: 'SMART BUDGET',
    badgeColor: '#FFA726',
  },
  {
    icon: 'file-export-outline',
    title: 'Export Reports',
    desc: 'Generate a CSV report for any period and share it instantly via WhatsApp, email, or Drive.',
    examples: [
      { label: 'Monthly', cmd: "Export this month's report" },
      { label: 'Weekly', cmd: 'Generate my week report' },
    ],
    badge: 'CSV EXPORT',
    badgeColor: '#45B7D1',
  },
  {
    icon: 'pencil-ruler',
    title: 'Quick Edits & Undo',
    desc: 'Made a mistake? Fix the last entry or undo a bulk delete in seconds.',
    examples: [
      { label: 'Edit amount', cmd: 'Change last amount to 500' },
      { label: 'Undo add', cmd: 'Undo' },
      { label: 'Undo delete', cmd: 'Undo delete' },
    ],
    badge: 'EDITS',
    badgeColor: '#4ECDC4',
  },
  {
    icon: 'chart-pie',
    title: 'Insights & Reports',
    desc: 'Ask for charts, summaries, or your biggest expense at any time.',
    examples: [
      { label: 'Chart', cmd: 'Show chart' },
      { label: 'Summary', cmd: "Show today's summary" },
      { label: 'Biggest', cmd: "What's my biggest expense?" },
    ],
    badge: 'ANALYTICS',
    badgeColor: '#DDA0DD',
  },
];

// ─────────────────────────────────────────────
//  TUTORIAL CARD
// ─────────────────────────────────────────────
const TutorialCard = ({ item, colors, onTryCommand, index, scrollAnim }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: 80 + index * 60, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 7, delay: 80 + index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.card, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>

        {/* Card header */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: item.badgeColor + '18' }]}>
            <IconButton icon={item.icon} size={20} iconColor={item.badgeColor} style={{ margin: 0 }} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: item.badgeColor + '20' }]}>
                <Text style={[styles.badgeText, { color: item.badgeColor }]}>{item.badge}</Text>
              </View>
            </View>
            <Text style={[styles.cardDesc, { color: colors.textSec }]}>{item.desc}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Example commands */}
        {item.examples.map((ex, i) => (
          <View
            key={i}
            style={[
              styles.codeRow,
              { backgroundColor: colors.background, borderColor: colors.border },
              i < item.examples.length - 1 && { marginBottom: 8 },
            ]}
          >
            <View style={styles.codeLeft}>
              <Text style={[styles.exLabel, { color: colors.textSec }]}>{ex.label}</Text>
              <Text style={[styles.exCmd, { color: colors.text }]}>{ex.cmd}</Text>
            </View>
            <TouchableOpacity
              onPress={() => onTryCommand(ex.cmd)}
              style={[styles.tryBtn, { borderColor: item.badgeColor + '40', backgroundColor: item.badgeColor + '10' }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.tryText, { color: item.badgeColor }]}>TRY</Text>
            </TouchableOpacity>
          </View>
        ))}

      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
//  MAIN MODAL
// ─────────────────────────────────────────────
const FinBotHelpModal = ({ visible, onClose, onTryCommand, colors }) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 65, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: screenHeight, duration: 260, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <View style={styles.overlay}>

        {/* Tappable dimmed backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: overlayAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        {/* Bottom sheet */}
        <Animated.View style={[styles.sheet, { backgroundColor: colors.surface, transform: [{ translateY: slideAnim }] }]}>

          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Sheet header */}
          <View style={styles.sheetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.botIconWrap, { backgroundColor: colors.primary + '18' }]}>
                <Avatar.Icon size={38} icon="robot-outline" color={colors.primary} style={{ backgroundColor: 'transparent' }} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>FinBot AI Guide</Text>
                <Text style={[styles.sheetSubtitle, { color: colors.textSec }]}>
                  {TUTORIALS.length} command groups · tap TRY to use any example
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.inputBg }]}>
              <IconButton icon="close" size={18} iconColor={colors.textSec} style={{ margin: 0 }} />
            </TouchableOpacity>
          </View>

          {/* NEW FEATURES strip */}
          <View style={[styles.newFeatureStrip, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
            <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700', letterSpacing: 0.5 }}>✦ NEW  </Text>
            <Text style={{ fontSize: 12, color: colors.primary }}>
              Bulk Delete · Budget Rebalance · CSV Export
            </Text>
          </View>

          {/* Tutorial cards */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {TUTORIALS.map((item, index) => (
              <TutorialCard
                key={index}
                item={item}
                index={index}
                colors={colors}
                onTryCommand={(cmd) => {
                  onClose();
                  setTimeout(() => onTryCommand(cmd), 300);
                }}
              />
            ))}

            {/* Footer tip */}
            <View style={[styles.footerTip, { borderColor: colors.border }]}>
              <Text style={[styles.footerText, { color: colors.textSec }]}>
                💡 FinBot understands natural language — you don't need to match commands exactly.
              </Text>
            </View>
          </ScrollView>

        </Animated.View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },

  sheet: {
    width: '100%',
    maxHeight: screenHeight * 0.88,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 14,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 24,
  },

  handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },

  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  botIconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontSize: 20, fontWeight: '800' },
  sheetSubtitle: { fontSize: 12, marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  newFeatureStrip: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 16,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
  },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Card
  card: { borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1 },

  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardDesc: { fontSize: 13, marginTop: 3, lineHeight: 18 },

  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },

  divider: { height: 1, marginBottom: 12 },

  codeRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1,
  },
  codeLeft: { flex: 1 },
  exLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  exCmd: { fontSize: 13, fontStyle: 'italic' },

  tryBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginLeft: 10 },
  tryText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },

  footerTip: { borderTopWidth: 1, paddingTop: 18, paddingBottom: 6 },
  footerText: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
});

export default FinBotHelpModal;