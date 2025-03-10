import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";

const API_URL = "https://radiantbackend.onrender.com";

const ProfileSetupScreen = ({ navigation, route }) => {
  const [profilePic, setProfilePic] = useState(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [interests, setInterests] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Enable permissions to upload a photo.");
      }
      
      const storedToken = await AsyncStorage.getItem("token");
      if (!storedToken) {
        Alert.alert("Session Expired", "Please log in again.");
        navigation.replace("LoginScreen");
      } else {
        setToken(storedToken);
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      
      if (!result.canceled) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error Selecting Image", error.message);
    }
  };

  const uploadImage = async (uri) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", { uri, type: "image/jpeg", name: "profile.jpg" });
      formData.append("upload_preset", "radiant_preset");
      
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dzljsey6i/image/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      
      setProfilePic(response.data.secure_url);
    } catch (error) {
      Alert.alert("Upload Failed", "Could not upload profile picture.");
    }
    setLoading(false);
  };

  const submitProfile = async () => {
    if (!profilePic || !selectedClass || !selectedSection || !interests || !instagram) {
      Alert.alert("Missing Fields", "Please fill in all details before continuing.");
      return;
    }
  
    setLoading(true);
    try {
      const storedToken = await AsyncStorage.getItem("token");
      if (!storedToken) {
        Alert.alert("Session Expired", "Please log in again.");
        navigation.replace("LoginScreen");
        return;
      }
  
      const response = await axios.post(`${API_URL}/Profile`, { 
        profilePic, class: selectedClass, section: selectedSection, 
        interests, instagramUsername: instagram 
      }, { headers: { token } });
      
      console.log("✅ Profile Update Response:", response.data);
      Alert.alert("Success", "Profile updated successfully!");
      navigation.replace("Homepage");
    } catch (error) {
      console.error("❌ Profile Update Error:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.error || "Could not update profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      
      <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
        {profilePic ? (
          <Image source={{ uri: profilePic }} style={styles.profileImage} />
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Text style={styles.uploadText}>Upload</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Select Class:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedClass}
          onValueChange={(value) => setSelectedClass(value)}
          style={styles.picker}
          dropdownIconColor="#fff"
        >
          <Picker.Item label="Select Class" value="" color="#000" />
{["6th", "7th", "8th", "9th", "10th", "11th", "12th"].map((cls) => (
  <Picker.Item key={cls} label={cls} value={cls} color="#000" />
))} 
        </Picker> 
      </View>

      <Text style={styles.label}>Select Section:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedSection}
          onValueChange={(value) => setSelectedSection(value)}
          style={styles.picker}
          dropdownIconColor="#fff"
        >
          <Picker.Item label="Select Section" value="" color="#000" />
{["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map((sec) => (
  <Picker.Item key={sec} label={sec} value={sec} color="#000" />
))}
        </Picker>
      </View>

      <Text style={styles.label}>Your Interests:</Text>
      <TextInput
        value={interests}
        onChangeText={setInterests}
        style={styles.input}
        placeholderTextColor="#666"
      />

      <Text style={styles.label}>Instagram Username:</Text>
      <TextInput
        value={instagram}
        onChangeText={setInstagram}
        style={styles.input}
        placeholderTextColor="#666"
      />

      <TouchableOpacity onPress={submitProfile} style={styles.button}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Finish</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
      flexGrow: 1,
      padding: 20,
      backgroundColor: '#fff', // Changed background to white
  },
  title: {
      color: '#333', // Changed title color
      fontSize: 32,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 30,
  },
  uploadButton: {
      alignSelf: 'center',
      marginBottom: 30,
  },
  profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      borderColor: '#5271FF', // Changed border color
  },
  uploadPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: '#f0f0f0', // Changed background color
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: '#5271FF', // Changed border color
  },
  uploadText: {
      color: '#333', // Changed text color
      fontSize: 16,
  },
  label: {
      color: '#333', // Changed label color
      fontSize: 16,
      marginBottom: 8,
      marginTop: 16,
  },
  pickerContainer: {
      backgroundColor: '#f0f0f0', // Changed background color
      borderRadius: 10,
      marginBottom: 16,
      borderWidth: 1, // Added border
      borderColor: '#ddd' // Added border Color.
  },
  picker: {
      color: '#333', // Changed picker text color
      backgroundColor: '#f0f0f0', // Changed picker background color
  },
  input: {
      backgroundColor: '#f0f0f0', // Changed background color
      color: '#333', // Changed input text color
      padding: 15,
      borderRadius: 10,
      marginBottom: 16,
      fontSize: 16,
      borderWidth: 1, // Added border
      borderColor: '#ddd' // Added border Color
  },
  button: {
      backgroundColor: '#5271FF', // Changed button color
      padding: 15,
      borderRadius: 30,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 30,
  },
  buttonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
  },
});
export default ProfileSetupScreen;