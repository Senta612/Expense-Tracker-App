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

// --- WHATSAPP MD3 TAB ICON RENDERER ---
const renderWhatsAppTab = (focused, outlineIcon, filledIcon, colors) => {
  return (
    <View style={{
      backgroundColor: focused ? colors.primary + '20' : 'transparent',
      paddingHorizontal: 18,
      paddingVertical: 4,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 5
    }}>
      <IconButton
        icon={focused ? filledIcon : outlineIcon}
        size={24}
        iconColor={focused ? colors.primary : colors.textSec}
        style={{ margin: 0 }}
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
          height: Platform.OS === 'ios' ? 85 : 70,
          paddingBottom: Platform.OS === 'ios' ? 25 : 12,
          paddingTop: 5,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSec,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginTop: 2
        }
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => renderWhatsAppTab(focused, "home-outline", "home", colors)
        }}
      />
      <Tab.Screen
        name="StatsTab"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ focused }) => renderWhatsAppTab(focused, "chart-pie-outline", "chart-pie", colors)
        }}
      />

      {/* ADD ENTRY TAB */}
      <Tab.Screen
        name="AddTab"
        component={View}
        options={{
          tabBarLabel: 'Add',
          tabBarIcon: ({ focused }) => renderWhatsAppTab(focused, "plus-circle-outline", "plus-circle", colors)
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('AddExpense');
          },
        })}
      />

      <Tab.Screen
        name="FilterTab"
        component={FilterScreen}
        options={{
          tabBarLabel: 'Filter',
          tabBarIcon: ({ focused }) => renderWhatsAppTab(focused, "filter-outline", "filter", colors)
        }}
      />
      <Tab.Screen
        name="SettingsTab"
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
          console.log('Notification permissions denied by user!');
          return;
        }
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