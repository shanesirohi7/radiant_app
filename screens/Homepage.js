import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

const API_URL = 'https://radiantbackend.onrender.com';

export default function Homepage({ navigation }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('Login');
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/profile`, { headers: { token } });
        setUser(res.data);
        fetchPosts();
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts`);
      setPosts(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load posts');
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.uri);
    }
  };

  const handlePost = async () => {
    if (!content) {
      Alert.alert('Error', 'Please enter some content');
      return;
    }
    setPosting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const postData = { content, image };
      await axios.post(`${API_URL}/createPost`, postData, { headers: { token } });
      setContent('');
      setImage(null);
      fetchPosts();
      Alert.alert('Success', 'Post created!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to post');
    }
    setPosting(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.replace('Login');
  };

  const renderPost = ({ item }) => (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <Image source={{ uri: item.user.profilePic }} style={styles.profilePic} />
        <Text style={styles.postUser}>{item.user.name}</Text>
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
      {item.image && <Image source={{ uri: item.image }} style={styles.postImage} />}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c5ce7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.postInputContainer}>
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          placeholderTextColor="#aaa"
          value={content}
          onChangeText={setContent}
        />
        <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
          <Text style={styles.imageButtonText}>📸</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePost} style={styles.postButton} disabled={posting}>
          <Text style={styles.postButtonText}>{posting ? 'Posting...' : 'Post'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={renderPost}
        contentContainerStyle={styles.postList}
      />

      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  postInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingHorizontal: 10,
  },
  imageButton: {
    marginHorizontal: 5,
  },
  imageButtonText: {
    fontSize: 22,
  },
  postButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  postList: {
    paddingBottom: 20,
  },
  post: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 15,
    marginBottom: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postUser: {
    color: '#fff',
    fontWeight: 'bold',
  },
  postContent: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    marginTop: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
