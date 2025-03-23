import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import {
  ChevronLeft,
  Camera,
  User,
  Instagram,
  FileText,
  Heart,
  ChevronDown,
} from 'lucide-react-native';

const API_URL = 'https://radiantbackend.onrender.com';
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dzljsey6i/image/upload'; // Replace 'dzljsey6i' with your Cloudinary cloud name
const CLOUDINARY_PRESET = 'radiant_preset'; // Replace with your Cloudinary upload preset

export default function ProfileEdit() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  
  // Form state
  const [name, setName] = useState('');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  
  // Relationship status options (matched to backend enum)
  const relationshipOptions = [
    'Single',
    'In a relationship',
    'Married',
    'Complicated',
    '', // Empty string for unset or "Prefer not to say"
  ];

  useEffect(() => {
    const loadUserData = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('Login');
        return;
      }
      
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Enable permissions to upload photos.');
        }

        const res = await axios.get(`${API_URL}/profile`, {
          headers: { token },
        });
        
        setUser(res.data);
        setName(res.data.name || '');
        setInstagramUsername(res.data.instagramUsername || '');
        setBio(res.data.bio || '');
        setProfilePic(res.data.profilePic || null);
        setCoverPhoto(res.data.coverPhoto || null);
        setRelationshipStatus(res.data.relationshipStatus || '');
      } catch (err) {
        console.error('Error loading user data:', err);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [navigation]);

  const pickImage = async (type) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'cover' ? [3, 1] : [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        uploadImage(imageUri, type);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const uploadImage = async (uri, type) => {
    setSaving(true); // Use saving state to indicate upload in progress
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg', // Assuming JPEG, adjust if needed
        name: `upload-${type}-${Date.now()}.jpg`,
      });
      formData.append('upload_preset', CLOUDINARY_PRESET);

      const response = await axios.post(CLOUDINARY_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrl = response.data.secure_url;
      if (type === 'cover') {
        setCoverPhoto(imageUrl);
      } else {
        setProfilePic(imageUrl);
      }
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error.response?.data || error);
      Alert.alert('Upload Failed', 'Could not upload image.');
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    
    setSaving(true);
    const token = await AsyncStorage.getItem('token');
    
    try {
      const profileData = {
        name,
        instagramUsername,
        bio,
        relationshipStatus,
        profilePic: profilePic || undefined,
        coverPhoto: coverPhoto || undefined,
      };

      // Remove undefined fields
      Object.keys(profileData).forEach(key => 
        profileData[key] === undefined && delete profileData[key]
      );

      const response = await axios.put(
        `${API_URL}/editprofile`,
        profileData,
        {
          headers: {
            token,
            'Content-Type': 'application/json',
          },
        }
      );
      
      setUser(response.data.user);
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (err) {
      console.error('Error updating profile:', err.response?.data || err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5271FF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color="#5271FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveProfile}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.container}>
        {/* Cover Photo Section */}
        <View style={styles.coverPhotoContainer}>
          {coverPhoto ? (
            <Image source={{ uri: coverPhoto }} style={styles.coverPhoto} />
          ) : (
            <View style={[styles.coverPhoto, { backgroundColor: '#ddd' }]}>
              <Text style={styles.placeholderText}>Add a cover photo</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.editCoverButton}
            onPress={() => pickImage('cover')}
            disabled={saving}
          >
            <Camera size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Profile Picture Section */}
        <View style={styles.profilePicSection}>
          <View style={styles.profilePicContainer}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.profilePic} />
            ) : (
              <View style={[styles.profilePic, { backgroundColor: '#ddd' }]}>
                <User size={40} color="#aaa" />
              </View>
            )}
            <TouchableOpacity
              style={styles.editProfilePicButton}
              onPress={() => pickImage('profile')}
              disabled={saving}
            >
              <Camera size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Name Field */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Name *</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor="#aaa"
                editable={!saving}
              />
            </View>
          </View>
          
          {/* Instagram Username Field */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Instagram Username</Text>
            <View style={styles.inputContainer}>
              <Instagram size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={instagramUsername}
                onChangeText={setInstagramUsername}
                placeholder="@yourusername"
                placeholderTextColor="#aaa"
                editable={!saving}
              />
            </View>
          </View>
          
          {/* Relationship Status Field */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Relationship Status</Text>
            <TouchableOpacity 
              style={styles.inputContainer}
              onPress={() => setShowRelationshipModal(true)}
              disabled={saving}
            >
              <Heart size={20} color="#666" style={styles.inputIcon} />
              <Text 
                style={[
                  styles.textInput, 
                  !relationshipStatus && { color: '#aaa' }
                ]}
              >
                {relationshipStatus || 'Select your relationship status'}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          {/* Bio Field */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <View style={styles.textareaContainer}>
              <FileText size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textareaInput}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                placeholderTextColor="#aaa"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!saving}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.note}>* Required fields</Text>
        </View>
      </ScrollView>
      
      {/* Relationship Status Modal */}
      <Modal
        visible={showRelationshipModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRelationshipModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Relationship Status</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowRelationshipModal(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {relationshipOptions.map((option) => (
                <TouchableOpacity
                  key={option || 'unset'}
                  style={[
                    styles.optionItem,
                    relationshipStatus === option && styles.selectedOption
                  ]}
                  onPress={() => {
                    setRelationshipStatus(option);
                    setShowRelationshipModal(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.optionText,
                      relationshipStatus === option && styles.selectedOptionText
                    ]}
                  >
                    {option || 'Prefer not to say'}
                  </Text>
                  {relationshipStatus === option && (
                    <View style={styles.checkmarkContainer}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Save Button (Floating) */}
      <TouchableOpacity
        style={styles.floatingSaveButton}
        onPress={saveProfile}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.floatingSaveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5271FF',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: '#5271FF',
    fontWeight: '600',
    fontSize: 16,
  },
  container: {
    flex: 1,
  },
  coverPhotoContainer: {
    height: 150,
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 60,
  },
  editCoverButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicSection: {
    alignItems: 'center',
    marginTop: -50,
  },
  profilePicContainer: {
    position: 'relative',
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editProfilePicButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#5271FF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  textareaContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: '#f9f9f9',
    minHeight: 120,
    alignItems: 'flex-start',
  },
  textareaInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingTop: 0,
    marginLeft: 10,
  },
  footer: {
    padding: 20,
    paddingBottom: 80,
  },
  note: {
    color: '#888',
    fontSize: 14,
  },
  floatingSaveButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    left: 20,
    backgroundColor: '#5271FF',
    borderRadius: 30,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingSaveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    color: '#5271FF',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsList: {
    paddingVertical: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#f0f8ff',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    fontWeight: '600',
    color: '#5271FF',
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#5271FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});