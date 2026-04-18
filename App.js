import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Provider as PaperProvider, IconButton } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { ExpenseProvider, useExpenses } from './src/context/ExpenseContext';
import HomeScreen from './src/screens/HomeScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import FilterScreen from './src/screens/FilterScreen';
import CustomAlert from './src/components/CustomAlert';
import UpdateModal from './src/components/UpdateModal';
import ChatScreen from './src/screens/ChatScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import FinancialInsightsScreen from './src/screens/FinancialInsightsScreen';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const renderWhatsAppTab = (focused, outlineIcon, filledIcon, colors) => {
  return (
    <View style={{
      width: 64,
      height: 32,
      backgroundColor: focused ? colors.primary + '1A' : 'transparent',
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    }}>
      <IconButton
        icon={focused ? filledIcon : outlineIcon}
        size={24}
        iconColor={focused ? colors.primary : colors.textSec}
        style={{ margin: 0, width: 24, height: 24 }}
      />
    </View>
  );
};

function MainTabs() {
  const { colors } = useExpenses();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 80,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSec,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: Platform.OS === 'android' ? 8 : 0,
        }
      }}
    >
      {/* ✨ FIX: Renamed these back to their original names so buttons work! */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => renderWhatsAppTab(focused, "home-outline", "home", colors)
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ focused }) => renderWhatsAppTab(focused, "chart-pie-outline", "chart-pie", colors)
        }}
      />
      <Tab.Screen
        name="Filter"
        component={FilterScreen}
        options={{
          tabBarLabel: 'Filter',
          tabBarIcon: ({ focused }) => renderWhatsAppTab(focused, "filter-outline", "filter", colors)
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => renderWhatsAppTab(focused, "cog-outline", "cog", colors)
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Main"
          screenOptions={{
            headerStyle: { backgroundColor: '#F5F7FA' },
            headerTintColor: '#1A1A1A',
            headerTitleStyle: { fontWeight: 'bold' },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add New Entry', headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="FinancialInsights" component={FinancialInsightsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Notifications" component={NotificationScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
      <CustomAlert />
      <UpdateModal />
    </SafeAreaProvider>
  );
}

export default function App() {
  useEffect(() => {
    async function requestPermissions() {
      if (Platform.OS === 'android') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('Notification permissions denied by user.');
          return;
        }

        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    }

    requestPermissions();
  }, []);

  return (
    <ExpenseProvider>
      <PaperProvider>
        <AppNavigator />
      </PaperProvider>
    </ExpenseProvider>
  );
}