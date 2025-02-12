import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StartingScreen from './screens/StartingScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import Homepage from './screens/Homepage';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import axios from 'axios';
const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState('Starting');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(`https://radiantbackend.onrender.com/profile`, { headers: { token } });
          const user = response.data || {}; // 🛑 Prevents null errors
    
          if (user.profilePic && user.class && user.section && user.interests?.length > 0) {
            setInitialRoute('Homepage');
          } else {
            setInitialRoute('ProfileSetup');
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          await AsyncStorage.removeItem('token'); // 🛑 Invalid token? Delete it!
          setInitialRoute('Login');
        }
      }
      setLoading(false);
    };
    
    checkLoginStatus();
  }, []);

  if (loading) {
    return null; // Prevents rendering while checking auth status
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Starting" component={StartingScreen} options={{ animationEnabled: true }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ animationEnabled: true }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ animationEnabled: true }} />
        <Stack.Screen name="Homepage" component={Homepage} options={{ animationEnabled: true }} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ animationEnabled: true }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
