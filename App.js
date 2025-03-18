import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StartingScreen from './screens/StartingScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import Homepage from './screens/Homepage';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import MakeMemoryScreen from './screens/MakeMemoryScreen';
import SearchScreen from './screens/SearchScreen';
import axios from 'axios';
import io from 'socket.io-client';
import ProfileScreen from './screens/ProfileScreen';
import OtherProfileScreen from './screens/OtherProfileScreen';
import Mainmessage from './screens/Mainmessage';
import MemeFeedScreen from './screens/MemeFeedScreen';
import MemoryDetailScreen from './screens/MemoryDetailScreen';
import Chat from './screens/Chat';
const Stack = createStackNavigator();

export default function App() {
    const [initialRoute, setInitialRoute] = useState('Starting');
    const [loading, setLoading] = useState(true);
    const socket = useRef(null);

    useEffect(() => {
        const checkLoginStatus = async () => {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                try {
                    const response = await axios.get(`https://radiantbackend.onrender.com/profile`, { headers: { token } });
                    const user = response.data || {};

                    if (user.profilePic && user.class && user.section && user.interests?.length > 0) {
                        setInitialRoute('Homepage');
                        //Connect socket here.
                        if (!socket.current){
                          socket.current = io('https://radiantbackend.onrender.com');
                        }

                    } else {
                        setInitialRoute('ProfileSetup');
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                    await AsyncStorage.removeItem('token');
                    setInitialRoute('Login');
                }
            }
            setLoading(false);
        };

        checkLoginStatus();
    }, []);

    const handleLogout = async () => {
      await AsyncStorage.removeItem('token');
      setInitialRoute('Login');
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
    };

    const handleLogin = async ()=>{
      const token = await AsyncStorage.getItem('token');
      if (token) {
          try {
              const response = await axios.get(`https://radiantbackend.onrender.com/profile`, { headers: { token } });
              const user = response.data || {};

              if (user.profilePic && user.class && user.section && user.interests?.length > 0) {
                  setInitialRoute('Homepage');
                  if (!socket.current){
                    socket.current = io('https://radiantbackend.onrender.com');
                  }
              } else {
                  setInitialRoute('ProfileSetup');
              }
          } catch (error) {
              console.error('Error fetching profile:', error);
              await AsyncStorage.removeItem('token');
              setInitialRoute('Login');
          }
      }
    }

    if (loading) {
        return null;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Starting" component={StartingScreen} options={{ animationEnabled: true }} />
                <Stack.Screen name="MakeMemoryScreen" component={MakeMemoryScreen} options={{ animationEnabled: true }} />
                <Stack.Screen name="SearchScreen" component={SearchScreen} options={{ animationEnabled: true }} />
                <Stack.Screen name="Login" options={{ animationEnabled: true }}>
                  {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
                </Stack.Screen>
                <Stack.Screen name="OtherProfile" component={OtherProfileScreen} options={{ animationEnabled: true }} />
                <Stack.Screen name="Signup" component={SignupScreen} options={{ animationEnabled: true }} />
                <Stack.Screen name="Homepage" options={{ animationEnabled: true }}>
                    {(props) => <Homepage {...props} socket={socket.current} onLogout={handleLogout} />}
                </Stack.Screen>
                <Stack.Screen name="Profile" component={ProfileScreen} options={{ animationEnabled: true }} />
                <Stack.Screen name="Mainmessage" component={Mainmessage} options={{ animationEnabled: true }} />
                <Stack.Screen name="MemoryDetailScreen" component={MemoryDetailScreen} options={{ animationEnabled: true }} />
                <Stack.Screen name="MemeFeedScreen" component={MemeFeedScreen} options={{ animationEnabled: true }} />
                <Stack.Screen name="Chat" component={Chat} options={{ animationEnabled: true }} />
                <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ animationEnabled: true }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}