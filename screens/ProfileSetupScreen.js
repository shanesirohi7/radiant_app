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
      const storedToken = await AsyncStorage.getItem("token"); // Ensure token is fresh
      if (!storedToken) {
        Alert.alert("Session Expired", "Please log in again.");
        navigation.replace("LoginScreen");
        return;
      }
  
      const response = await axios.post(`${API_URL}/setupProfile`, { 
        profilePic, class: selectedClass, section: selectedSection, 
        interests, instagramUsername: instagram 
      }, { headers: { token } }); // Backend expects 'token' in headers
      
  
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
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, backgroundColor: "#0D47A1" }}>
      <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 }}>
        Complete Your Profile
      </Text>
      
      <TouchableOpacity onPress={pickImage} style={{ alignSelf: "center", marginBottom: 20 }}>
        {profilePic ? (
          <Image source={{ uri: profilePic }} style={{ width: 100, height: 100, borderRadius: 50 }} />
        ) : (
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: "#1E88E5", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: "#fff" }}>Upload</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={{ color: "#fff", fontSize: 16, marginBottom: 5 }}>Select Class:</Text>
      <Picker selectedValue={selectedClass} onValueChange={(value) => setSelectedClass(value)} style={{ backgroundColor: "#1976D2", color: "#fff", marginBottom: 10 }}>
        <Picker.Item label="Select Class" value="" />
        {["6th", "7th", "8th", "9th", "10th", "11th", "12th"].map((cls) => (
          <Picker.Item key={cls} label={cls} value={cls} />
        ))}
      </Picker>

      <Text style={{ color: "#fff", fontSize: 16, marginBottom: 5 }}>Select Section:</Text>
      <Picker selectedValue={selectedSection} onValueChange={(value) => setSelectedSection(value)} style={{ backgroundColor: "#1976D2", color: "#fff", marginBottom: 10 }}>
        <Picker.Item label="Select Section" value="" />
        {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map((sec) => (
          <Picker.Item key={sec} label={sec} value={sec} />
        ))}
      </Picker>

      <Text style={{ color: "#fff", fontSize: 16, marginBottom: 5 }}>Your Interests:</Text>
      <TextInput value={interests} onChangeText={setInterests} style={{ backgroundColor: "#1976D2", color: "#fff", padding: 10, borderRadius: 5, marginBottom: 10 }} />

      <Text style={{ color: "#fff", fontSize: 16, marginBottom: 5 }}>Instagram Username:</Text>
      <TextInput value={instagram} onChangeText={setInstagram} style={{ backgroundColor: "#1976D2", color: "#fff", padding: 10, borderRadius: 5, marginBottom: 20 }} />

      <TouchableOpacity onPress={submitProfile} style={{ backgroundColor: "#64B5F6", padding: 15, borderRadius: 10, alignItems: "center" }}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 18 }}>Finish</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileSetupScreen;