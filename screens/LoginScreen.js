import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation, onLogin }) { // Receive onLogin prop
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            const response = await axios.post('https://radiantbackend.onrender.com/login', {
                email,
                password,
            });

            if (response.data.token) {
                await AsyncStorage.setItem('token', response.data.token);
                await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

                Alert.alert('Login Successful', `Welcome back, ${response.data.user.name}!`);
                setTimeout(() => {
                    navigation.replace('Homepage');
                    onLogin(); // Call the onLogin function from App.js
                }, 500);
            } else {
                Alert.alert('Error', 'Something went wrong');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Login Failed', error.response?.data?.error || 'Server error, please try again later');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Log in to your account</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#666"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#666"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Log In</Text>
            </TouchableOpacity>

            <Text style={styles.orText}>or</Text>

            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.linkText}>Create an account</Text>
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
        borderRadius: 10,
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
        borderRadius: 30,
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