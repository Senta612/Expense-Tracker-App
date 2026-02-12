import React, { useState } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    Dimensions,
    TouchableOpacity,
} from "react-native";
import { Text, Surface, IconButton, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { PieChart, ProgressChart } from "react-native-chart-kit";
import { useExpenses } from "../context/ExpenseContext";

const screenWidth = Dimensions.get("window").width;

export default function StatsScreen({ navigation }) {
    const { expenses, budget, getTotalSpent, currency, categories, colors } =
        useExpenses(); // <--- GET COLORS
    const [selectedCategory, setSelectedCategory] = useState(null);

    // 1. Budget Data
    const totalSpent = getTotalSpent();
    const totalBudget = parseFloat(budget) || 1;
    const percentageUsed = totalSpent / totalBudget;
    const chartPercent = percentageUsed > 1 ? 1 : percentageUsed;

    const budgetData = { data: [chartPercent] };
    let ringColor = (opacity = 1) => `rgba(76, 175, 80, ${opacity})`;
    if (percentageUsed > 0.5)
        ringColor = (opacity = 1) => `rgba(255, 193, 7, ${opacity})`;
    if (percentageUsed > 0.9)
        ringColor = (opacity = 1) => `rgba(244, 67, 54, ${opacity})`;

    // 2. Pie Data
    const palette = [
        "#6C63FF",
        "#FF6584",
        "#FFC75F",
        "#4BC0C0",
        "#845EC2",
        "#FF9671",
        "#008F7A",
    ];

    const pieData = categories
        .map((cat, index) => {
            const totalForCat = expenses
                .filter((e) => e.category === cat)
                .reduce((sum, item) => sum + item.amount, 0);
            const isSelected = selectedCategory === cat;
            const isAnySelected = selectedCategory !== null;
            let sliceColor = palette[index % palette.length];
            if (isAnySelected && !isSelected) sliceColor = colors.chip; // Use Theme Chip Color (Gray/DarkGray)

            return {
                name: cat,
                amount: totalForCat,
                color: sliceColor,
                legendFontColor: "#7F7F7F",
                legendFontSize: 12,
            };
        })
        .filter((item) => item.amount > 0);

    pieData.sort((a, b) => b.amount - a.amount);

    const handlePress = (name) => {
        setSelectedCategory(selectedCategory === name ? null : name);
    };

    const activeItem = pieData.find((i) => i.name === selectedCategory);
    const centerLabel = activeItem ? activeItem.name : "Total";
    const centerAmount = activeItem ? activeItem.amount : totalSpent;
    const centerColor = activeItem ? activeItem.color : colors.text;

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
            edges={["top", "left", "right"]}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <IconButton
                        icon="arrow-left"
                        size={28}
                        iconColor={colors.text}
                        style={{ marginLeft: -10 }}
                    />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    Financial Insights
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* BUDGET CARD */}
                <Surface
                    style={[styles.budgetCard, { backgroundColor: colors.surface }]}
                    elevation={3}
                >
                    <View style={styles.ringRow}>
                        <ProgressChart
                            data={budgetData}
                            width={100}
                            height={100}
                            strokeWidth={10}
                            radius={40}
                            chartConfig={{
                                backgroundGradientFrom: colors.surface,
                                backgroundGradientTo: colors.surface,
                                color: ringColor,
                                strokeWidth: 2,
                            }}
                            hideLegend={true}
                        />
                        <View style={styles.budgetInfo}>
                            <Text style={[styles.budgetLabel, { color: colors.textSec }]}>
                                Monthly Budget
                            </Text>
                            <Text style={[styles.budgetValue, { color: colors.text }]}>
                                {(percentageUsed * 100).toFixed(0)}% Used
                            </Text>
                            <View
                                style={[
                                    styles.barContainer,
                                    { backgroundColor: colors.inputBg },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.barFill,
                                        {
                                            width: `${chartPercent * 100}%`,
                                            backgroundColor: ringColor(1),
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={[styles.budgetMath, { color: colors.textSec }]}>
                                {currency}
                                {totalSpent.toLocaleString()} / {currency}
                                {totalBudget.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </Surface>

                {/* SPENDING BREAKDOWN */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Spending Breakdown
                </Text>

                <Surface
                    style={[styles.chartCard, { backgroundColor: colors.surface }]}
                    elevation={2}
                >
                    {pieData.length > 0 ? (
                        <>
                            <View style={styles.chartWrapper}>
                                <PieChart
                                    data={pieData}
                                    width={screenWidth}
                                    height={240}
                                    chartConfig={{ color: (opacity = 1) => colors.text }} // Dynamic Color
                                    accessor={"amount"}
                                    backgroundColor={"transparent"}
                                    paddingLeft={screenWidth / 4}
                                    center={[0, 0]}
                                    hasLegend={false}
                                    absolute
                                />
                                <View
                                    style={[
                                        styles.donutHole,
                                        { backgroundColor: colors.surface },
                                    ]}
                                >
                                    <Text style={[styles.donutLabel, { color: centerColor }]}>
                                        {centerLabel}
                                    </Text>
                                    <Text style={[styles.donutAmount, { color: colors.text }]}>
                                        {currency}
                                        {centerAmount.toLocaleString()}
                                    </Text>
                                </View>
                            </View>

                            <Divider
                                style={{ marginVertical: 15, backgroundColor: colors.border }}
                            />
                            <Text style={[styles.hintText, { color: colors.textSec }]}>
                                Tap a category below to highlight 👆
                            </Text>

                            <View style={styles.listContainer}>
                                {pieData.map((item) => {
                                    const isSelected = selectedCategory === item.name;
                                    return (
                                        <TouchableOpacity
                                            key={item.name}
                                            onPress={() => handlePress(item.name)}
                                            style={[
                                                styles.listItem,
                                                isSelected && { backgroundColor: colors.inputBg },
                                                { borderBottomColor: colors.border },
                                            ]}
                                        >
                                            <View
                                                style={{ flexDirection: "row", alignItems: "center" }}
                                            >
                                                <View
                                                    style={[styles.dot, { backgroundColor: item.color }]}
                                                />
                                                <Text
                                                    style={[
                                                        styles.listName,
                                                        { color: colors.text },
                                                        isSelected && { fontWeight: "bold" },
                                                    ]}
                                                >
                                                    {item.name}
                                                </Text>
                                            </View>
                                            <View style={{ alignItems: "flex-end" }}>
                                                <Text
                                                    style={[
                                                        styles.listAmount,
                                                        { color: isSelected ? item.color : colors.text },
                                                    ]}
                                                >
                                                    -{currency}
                                                    {item.amount.toLocaleString()}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.listPercent,
                                                        { color: colors.textSec },
                                                    ]}
                                                >
                                                    {((item.amount / totalSpent) * 100).toFixed(0)}%
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </>
                    ) : (
                        <View style={styles.emptyState}>
                            <IconButton
                                icon="chart-donut"
                                size={40}
                                iconColor={colors.border}
                            />
                            <Text style={{ color: colors.textSec }}>
                                No expenses yet this month.
                            </Text>
                        </View>
                    )}
                </Surface>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 50 },
    header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    headerTitle: { fontSize: 24, fontWeight: "800", marginLeft: 0 },

    budgetCard: { borderRadius: 24, padding: 20, marginBottom: 25, elevation: 3 },
    ringRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
    },
    budgetInfo: { marginLeft: 20, flex: 1 },
    budgetLabel: { fontSize: 12, textTransform: "uppercase", fontWeight: "600" },
    budgetValue: { fontSize: 22, fontWeight: "800", marginBottom: 5 },
    budgetMath: { fontSize: 14, marginTop: 5, fontWeight: "500" },
    barContainer: {
        height: 6,
        borderRadius: 3,
        width: "100%",
        overflow: "hidden",
    },
    barFill: { height: "100%", borderRadius: 3 },

    sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 15 },

    chartCard: { borderRadius: 24, padding: 20, marginBottom: 20, elevation: 2 },
    chartWrapper: { alignItems: "center", justifyContent: "center", height: 240 },
    donutHole: {
        position: "absolute",
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
        pointerEvents: "none",
    },
    donutLabel: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 2,
        textTransform: "uppercase",
    },
    donutAmount: { fontSize: 24, fontWeight: "800" },

    hintText: {
        textAlign: "center",
        fontSize: 12,
        marginBottom: 10,
        fontStyle: "italic",
    },

    listContainer: { paddingHorizontal: 10 },
    listItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 10,
    },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    listName: { fontSize: 15, fontWeight: "500" },
    listAmount: { fontSize: 15, fontWeight: "600" },
    listPercent: { fontSize: 12, marginTop: 2 },

    emptyState: { alignItems: "center", padding: 40 },
});
