import React, { useEffect } from 'react'; // <-- Added useEffect
import { Platform } from 'react-native'; // <-- Added Platform
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications'; // <-- Added Notifications

// Import our custom files
import { ExpenseProvider } from './src/context/ExpenseContext';
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


// --- 🔔 FOREGROUND NOTIFICATION HANDLER ---
// This tells the app to show a banner and play a sound even if you are actively using the app.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Stack = createNativeStackNavigator();

export default function App() {

  // --- 🔒 REQUEST ANDROID 13+ PERMISSIONS ON STARTUP ---
  useEffect(() => {
    async function requestPermissions() {
      if (Platform.OS === 'android') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        // If no permission, ask the user with a system popup
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
    // 1. Data Layer: Provides access to expenses anywhere
    <ExpenseProvider>

      {/* 2. UI Layer: Makes Paper components look good */}
      <PaperProvider>
        <SafeAreaProvider>

          {/* 3. Navigation Layer: Handles moving between screens */}
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerStyle: { backgroundColor: '#F5F7FA' },
                headerTintColor: '#1A1A1A',
                headerTitleStyle: { fontWeight: 'bold' },
                headerShadowVisible: false,
              }}
            >

              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="AddExpense"
                component={AddExpenseScreen}
                options={{ title: 'Add New Entry', headerShown: false }}
              />

              <Stack.Screen
                name="Stats"
                component={StatsScreen}
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="FinancialInsights"
                component={FinancialInsightsScreen}
                options={{ headerShown: false }}
              />


              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="Filter"
                component={FilterScreen}
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="Chat"
                component={ChatScreen}
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="Notifications"
                component={NotificationScreen}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
          <CustomAlert />
          <UpdateModal />
        </SafeAreaProvider>
      </PaperProvider>
    </ExpenseProvider>
  );
}