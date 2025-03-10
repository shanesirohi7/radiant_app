import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Alert, ActivityIndicator 
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState('SAJSVG');
  const [loading, setLoading] = useState(false);

  const API_URL = 'https://radiantbackend.onrender.com';


  const handleSignup = async () => {
    if (!name || !email || !password || !school) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
  
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/signup`, { 
        name, email, password, school 
      });
  
      if (response.status === 201 && response.data.token) {
        console.log("✅ Signup Successful:", response.data);
        
        // ✅ Store the token
        await AsyncStorage.setItem("token", response.data.token);
        
        // ✅ Navigate to profile setup
        navigation.replace("ProfileSetup", { userId: response.data.userId });
      } else {
        Alert.alert("Error", "Unexpected response. Please try again.");
      }
    } catch (error) {
      console.error("❌ Signup Error:", error);
      Alert.alert("Signup Failed", error.response?.data?.error || "Server error. Please try again later.");
    } finally {
      setLoading(false); // ✅ Ensures loading stops even if an error occurs
    }
  };
  


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Radiant!</Text>
      <Text style={styles.subtitle}>Create your account</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor="#bbb"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#bbb"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#bbb"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#6c5ce7" style={{ marginVertical: 20 }} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.orText}>or</Text>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff', // Changed background to white
      padding: 20,
  },
  title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#333', // Changed title color
      marginBottom: 10,
  },
  subtitle: {
      fontSize: 18,
      color: '#777', // Changed subtitle color
      marginBottom: 30,
  },
  input: {
      width: '100%',
      backgroundColor: '#f0f0f0', // Light background for input
      padding: 15,
      borderRadius: 20,
      marginVertical: 10,
      color: '#333', // Changed input text color
      fontSize: 16,
      borderWidth: 1, // Added border
      borderColor: '#ddd', // Light border color
  },
  button: {
      backgroundColor: '#5271FF', // Changed button color
      paddingVertical: 15,
      paddingHorizontal: 40,
      borderRadius: 25,
      marginTop: 20,
  },
  buttonText: {
      fontSize: 18,
      color: '#fff',
      fontWeight: 'bold',
  },
  orText: {
      fontSize: 16,
      color: '#888',
      marginVertical: 20,
  },
  linkText: {
      fontSize: 16,
      color: '#5271FF', // Changed link text color
      fontWeight: 'bold',
  },
});