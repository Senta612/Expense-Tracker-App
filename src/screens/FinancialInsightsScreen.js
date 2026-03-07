import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, Pressable } from 'react-native';
import { Text, IconButton, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { G, Circle, Path } from 'react-native-svg';
import { useExpenses } from '../context/ExpenseContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Premium 10-color palette for top 10 categories (by rank)
const COLOR_PALETTE = [
  '#6B52FF', // Purple - #1
  '#FF6B6B', // Coral Red - #2
  '#4ECDC4', // Teal - #3
  '#45B7D1', // Sky Blue - #4
  '#FFA726', // Orange - #5
  '#96CEB4', // Sage Green - #6
  '#DDA0DD', // Plum - #7
  '#42A5F5', // Royal Blue - #8
  '#FF7043', // Deep Orange - #9
  '#26A69A', // Green Teal - #10
];

// Fallback color for categories beyond top 10
const FALLBACK_COLOR = '#B0BEC5'; // Muted blue-gray

// Category icon mapping (professional icons only - no emojis)
const CATEGORY_ICONS = {
  'Food': 'silverware-fork-knife',
  'Travel': 'car',
  'Bills': 'file-document-outline',
  'Shopping': 'shopping-outline',
  'Health': 'medical-bag',
  'Entertainment': 'movie-open-outline',
  'Education': 'school-outline',
  'Investment': 'chart-line',
  'Other': 'dots-horizontal',
};

// --- INTERACTIVE DONUT CHART COMPONENT ---
// ✨ FIX: Added `colors` as a prop so it can adapt to Dark Mode
const InteractiveDonutChart = ({
  data,
  size = 160,
  strokeWidth = 24,
  selectedIndex,
  onSelect,
  centerData,
  colors
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const centerFadeAnim = useRef(new Animated.Value(0)).current;
  const centerScaleAnim = useRef(new Animated.Value(0.9)).current;

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const donutHoleSize = size * 0.42;

  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(centerFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(centerScaleAnim, { toValue: 1, friction: 10, tension: 50, useNativeDriver: true }),
      ])
    ]).start();
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(centerFadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(centerFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();
  }, [selectedIndex, centerData]);

  let currentAngle = -90;

  const segments = useMemo(() => {
    return data.map((item) => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0;
      const angle = (percentage / 100) * 360;
      const isSelected = selectedIndex === data.indexOf(item);

      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      ].join(' ');

      return {
        ...item,
        percentage,
        pathData,
        color: item.color,
        isSelected,
      };
    });
  }, [data, total, selectedIndex, center, radius]);

  const handleSegmentPress = (index) => {
    onSelect(index === selectedIndex ? null : index);
  };

  const displayContent = selectedIndex !== null ? centerData : { label: 'TOTAL', amount: total };

  const getStrokeWidth = (segment) => segment.isSelected ? strokeWidth * 1.04 : strokeWidth;

  return (
    <View style={[styles.chartWrapper, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.chartContainer,
          {
            width: size,
            height: size,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            overflow: 'visible',
          }
        ]}
      >
        <Svg width={size} height={size}>
          <G>
            {segments.map((segment, index) => (
              <Path
                key={index}
                d={segment.pathData}
                stroke={segment.color}
                strokeWidth={getStrokeWidth(segment)}
                fill="none"
                strokeLinecap="butt"
                opacity={selectedIndex !== null && !segment.isSelected ? 0.35 : 1}
                onPress={() => handleSegmentPress(index)}
              />
            ))}
          </G>
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          styles.chartCenterOverlay,
          {
            opacity: centerFadeAnim,
            transform: [{ scale: centerScaleAnim }],
          }
        ]}
        pointerEvents="none"
      >
        {/* ✨ FIX: Dynamic text colors instead of hardcoded hex values */}
        <Text style={[styles.centerLabel, { color: colors.textSec }]}>
          {displayContent.label}
        </Text>
        <Text style={[styles.centerAmount, { color: colors.text }]}>
          {displayContent.amount}
        </Text>
        {selectedIndex !== null && (
          <Text style={[styles.centerPercentage, { color: colors.textSec }]}>
            {displayContent.percentage}%
          </Text>
        )}
      </Animated.View>
    </View>
  );
};

// --- BUDGET CARD COMPONENT ---
const BudgetCard = ({ spent, budget, currency, colors }) => {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const ringSize = 100;
  const strokeWidth = 10;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: percentage,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const remaining = budget - spent;
  const isOverBudget = spent > budget;

  return (
    <Surface style={[styles.budgetCard, { backgroundColor: colors.surface }]}>
      <View style={styles.budgetContent}>
        <View style={styles.ringContainer}>
          <Svg width={ringSize} height={ringSize}>
            <Circle cx={ringSize / 2} cy={ringSize / 2} r={radius} stroke={colors.border} strokeWidth={strokeWidth} fill="none" />
            <Circle cx={ringSize / 2} cy={ringSize / 2} r={radius} stroke={isOverBudget ? colors.error : colors.primary} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" rotation="-90" origin={`${ringSize / 2}, ${ringSize / 2}`} />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={[styles.ringPercentage, { color: isOverBudget ? colors.error : colors.text }]}>
              {Math.round(percentage)}%
            </Text>
            <Text style={[styles.ringLabel, { color: colors.textSec }]}>Used</Text>
          </View>
        </View>

        <View style={styles.budgetDetails}>
          <Text style={[styles.budgetTitle, { color: colors.textSec }]}>MONTHLY BUDGET</Text>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: isOverBudget ? colors.error : colors.primary,
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]}
              />
            </View>
          </View>

          <View style={styles.amountRow}>
            <Text style={[styles.amountUsed, { color: isOverBudget ? colors.error : colors.text }]}>
              {currency}{spent.toLocaleString('en-IN')}
            </Text>
            <Text style={[styles.amountLimit, { color: colors.textSec }]}>
              / {currency}{budget.toLocaleString('en-IN')}
            </Text>
          </View>

          <Text style={[styles.remainingText, { color: isOverBudget ? colors.error : colors.success }]}>
            {isOverBudget
              ? `${currency}${Math.abs(remaining).toLocaleString('en-IN')} over budget`
              : `${currency}${remaining.toLocaleString('en-IN')} remaining`
            }
          </Text>
        </View>
      </View>
    </Surface>
  );
};

// --- CATEGORY INSIGHT ROW COMPONENT ---
// ✨ FIX: Added `colors` prop here too
const CategoryInsightRow = ({
  name,
  amount,
  percentage,
  color,
  icon,
  currency,
  index,
  isSelected,
  onPress,
  colors
}) => {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 300, delay: index * 50, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const backgroundColor = isSelected ? color + '12' : isPressed ? color + '08' : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      <Animated.View
        style={[
          styles.insightRow,
          {
            transform: [{ translateY }],
            opacity,
            backgroundColor,
            borderRadius: 12,
          }
        ]}
      >
        <View style={styles.insightLeft}>
          <View style={[styles.insightIconBox, { backgroundColor: color + '20' }]}>
            <IconButton icon={icon} size={18} iconColor={color} style={{ margin: 0 }} />
          </View>
          <View style={styles.insightInfo}>
            {/* ✨ FIX: Dynamic text and background colors */}
            <Text style={[styles.insightName, { color: colors.text }]}>{name}</Text>
            <View style={[styles.miniBarBg, { backgroundColor: colors.border }]}>
              <Animated.View
                style={[
                  styles.miniBarFill,
                  { backgroundColor: color, width: `${percentage}%` }
                ]}
              />
            </View>
          </View>
        </View>
        <View style={styles.insightRight}>
          <Text style={[styles.insightAmount, { color: colors.text }]}>
            {currency}{amount.toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.insightPercentage, { color: colors.textSec }]}>
            {percentage.toFixed(1)}%
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

// --- SPENDING BREAKDOWN CARD COMPONENT ---
const SpendingBreakdownCard = ({
  data,
  total,
  currency,
  colors,
  selectedIndex,
  onSelectCategory
}) => {
  const [localSelected, setLocalSelected] = useState(null);

  const handleSelect = (index) => {
    const newSelection = index === localSelected ? null : index;
    setLocalSelected(newSelection);
    onSelectCategory(newSelection);
  };

  const handleListSelect = (index) => {
    handleSelect(index);
  };

  const centerData = localSelected !== null ? {
    label: data[localSelected].name.toUpperCase(),
    amount: `${currency}${data[localSelected].value.toLocaleString('en-IN')}`,
    percentage: data[localSelected].percentage.toFixed(1)
  } : null;

  const topCategory = data.length > 0 ? data[0] : null;

  return (
    <Surface style={[styles.breakdownCard, { backgroundColor: colors.surface }]}>
      <View style={styles.breakdownHeader}>
        <View>
          <Text style={[styles.breakdownTitle, { color: colors.text }]}>Spending Breakdown</Text>
          <Text style={[styles.breakdownSubtitle, { color: colors.textSec }]}>
            Category distribution
          </Text>
        </View>
        <View style={styles.totalDisplay}>
          <Text style={[styles.totalLabel, { color: colors.textSec }]}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>
            {currency}{total.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <View style={[styles.headerDivider, { backgroundColor: colors.border }]} />

      {topCategory && (
        <View style={[styles.topCategoryBadge, { backgroundColor: topCategory.color + '15' }]}>
          <Text style={[styles.topCategoryLabel, { color: colors.textSec }]}>Top Category</Text>
          <Text style={[styles.topCategoryValue, { color: topCategory.color }]}>
            {topCategory.name} — {topCategory.percentage.toFixed(0)}%
          </Text>
        </View>
      )}

      <View style={styles.chartCardContainer}>
        {data.length > 0 ? (
          <InteractiveDonutChart
            data={data}
            size={Math.min(SCREEN_WIDTH * 0.45, 160)}
            strokeWidth={24}
            selectedIndex={localSelected}
            onSelect={handleSelect}
            centerData={centerData}
            colors={colors} // ✨ FIX: Passed colors down
          />
        ) : (
          <View style={styles.emptyChart}>
            <IconButton icon="chart-donut" size={50} iconColor={colors.textSec} />
            <Text style={[styles.emptyText, { color: colors.textSec }]}>No expenses</Text>
          </View>
        )}
      </View>

      <View style={styles.legendList}>
        {data.map((item, index) => (
          <CategoryInsightRow
            key={item.name}
            name={item.name}
            amount={item.value}
            percentage={item.percentage}
            color={item.color}
            icon={item.icon}
            currency={currency}
            index={index}
            isSelected={localSelected === index}
            onPress={() => handleListSelect(index)}
            colors={colors} // ✨ FIX: Passed colors down
          />
        ))}
      </View>
    </Surface>
  );
};

// --- MAIN SCREEN ---
export default function FinancialInsightsScreen({ navigation }) {
  const { getFilteredExpenses, colors, currency, budget } = useExpenses();
  const [timeFilter, setTimeFilter] = useState('Month');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const currentData = getFilteredExpenses(timeFilter);
  const expenses = currentData.filter(item => item.type === 'expense' || !item.type);
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

  const categoryTotals = expenses.reduce((acc, item) => {
    const cat = item.category || 'Other';
    acc[cat] = (acc[cat] || 0) + item.amount;
    return acc;
  }, {});

  const sortedCategories = useMemo(() => {
    const sorted = Object.entries(categoryTotals)
      .map(([name, value], index) => ({
        name,
        value,
        percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
        color: index < COLOR_PALETTE.length ? COLOR_PALETTE[index] : FALLBACK_COLOR,
        icon: CATEGORY_ICONS[name] || 'dots-horizontal',
        rank: index,
      }))
      .sort((a, b) => b.value - a.value);
    return sorted;
  }, [categoryTotals, totalExpense]);

  const monthlyBudget = budget || 7000;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <IconButton icon="arrow-left" size={24} iconColor={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Financial Insights</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.filterContainer}>
        {['Week', 'Month', 'Year'].map(filter => (
          <TouchableOpacity
            key={filter}
            onPress={() => {
              setTimeFilter(filter);
              setSelectedCategory(null);
            }}
            style={[
              styles.filterPill,
              timeFilter === filter
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
            ]}
          >
            <Text style={[
              styles.filterText,
              { color: timeFilter === filter ? '#FFF' : colors.textSec }
            ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BudgetCard
          spent={totalExpense}
          budget={monthlyBudget}
          currency={currency}
          colors={colors}
        />

        <SpendingBreakdownCard
          data={sortedCategories}
          total={totalExpense}
          currency={currency}
          colors={colors}
          selectedIndex={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backButton: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  filterPill: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  filterText: { fontSize: 14, fontWeight: '600' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  budgetCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    marginBottom: 24,
  },
  budgetContent: { flexDirection: 'row', alignItems: 'center' },
  ringContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringPercentage: { fontSize: 22, fontWeight: '800' },
  ringLabel: { fontSize: 11, fontWeight: '500' },
  budgetDetails: { flex: 1 },
  budgetTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  progressBarContainer: { marginBottom: 12 },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 },
  amountUsed: { fontSize: 20, fontWeight: '800' },
  amountLimit: { fontSize: 14, marginLeft: 4 },
  remainingText: { fontSize: 13, fontWeight: '600' },

  breakdownCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    marginBottom: 24,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  breakdownTitle: { fontSize: 20, fontWeight: '700' },
  breakdownSubtitle: { fontSize: 12, marginTop: 2 },
  totalDisplay: { alignItems: 'flex-end' },
  totalLabel: { fontSize: 11, fontWeight: '500' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  headerDivider: { height: 1, marginVertical: 16, opacity: 0.3 },

  topCategoryBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  topCategoryLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  topCategoryValue: { fontSize: 14, fontWeight: '700' },

  chartCardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
  },
  centerAmount: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  centerPercentage: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: { fontSize: 14, marginTop: 8 },

  legendList: {
    marginTop: 8,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginVertical: 2,
  },
  insightLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  insightIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightInfo: {
    flex: 1,
  },
  insightName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  miniBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: '80%',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  insightRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  insightAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  insightPercentage: {
    fontSize: 11,
    marginTop: 2,
  },
});