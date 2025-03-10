import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function StartingScreen() {
  const navigation = useNavigation();
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
        <Text style={styles.title}>The Social Media For</Text>
        <Text style={styles.subtitle}>SAJS</Text>
        <Text style={styles.description}>Exclusivity? Leave it up to us.</Text>
      </Animated.View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#fff', // Changed background to white
      paddingVertical: 50,
  },
  textContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
  },
  title: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#333', // Changed title color
      textAlign: 'center',
  },
  subtitle: {
      fontSize: 32,
      fontWeight: '600',
      color: '#5271FF', // Changed subtitle color
      textAlign: 'center',
      marginTop: 10,
  },
  description: {
      fontSize: 16,
      color: '#777', // Changed description color
      marginTop: 20,
      textAlign: 'center',
  },
  button: {
      backgroundColor: '#5271FF', // Changed button color
      paddingVertical: 15,
      paddingHorizontal: 40,
      borderRadius: 30,
      marginBottom: 40,
      shadowColor: '#5271FF', // Changed shadow color
      shadowOpacity: 0.5, // Reduced shadow opacity
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 5, // Reduced elevation
  },
  buttonText: {
      fontSize: 18,
      color: '#fff',
      fontWeight: 'bold',
  },
});