import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'https://radiantbackend.onrender.com';

// Define themes directly in the file (same as App.js and SearchScreen.js)
const themes = {
  light: {
    background: '#FFFFFF',
    primary: '#8ECAE6',
    secondary: '#FF007F',
    text: '#000000',
    accent: '#58D68D',
  },
  dark: {
    background: '#121212',
    primary: '#BB86FC',
    secondary: '#03DAC6',
    text: '#EAEAEA',
    accent: '#CF6679',
  },
  cyberpunk: {
    background: '#000000',
    primary: '#FF007F',
    secondary: '#00FFFF',
    text: '#FFFFFF',
    accent: '#FFD700',
  },
  bumblebee: {
    background: '#FFF4A3',
    primary: '#FFC107',
    secondary: '#FF9800',
    text: '#000000',
    accent: '#6A1B9A',
  },
  synthwave: {
    background: '#1A1A40',
    primary: '#FF00FF',
    secondary: '#00A3FF',
    text: '#F8F8F2',
    accent: '#FFD700',
  },
  luxury: {
    background: '#000000',
    primary: '#FFFFFF',
    secondary: '#1A1A1A',
    text: '#FFD700',
    accent: '#800080',
  },
  halloween: {
    background: '#181818',
    primary: '#FF8C00',
    secondary: '#800080',
    text: '#FFFFFF',
    accent: '#008000',
  },
  aqua: {
    background: '#00FFFF',
    primary: '#6A5ACD',
    secondary: '#FFD700',
    text: '#000000',
    accent: '#4682B4',
  },
  dracula: {
    background: '#282A36',
    primary: '#BD93F9',
    secondary: '#FFB86C',
    text: '#F8F8F2',
    accent: '#50FA7B',
  },
  forest: {
    background: '#0B3D02',
    primary: '#4CAF50',
    secondary: '#3E8E41',
    text: '#FFFFFF',
    accent: '#228B22',
  },
};

export default function MakeMemoryScreen() {
  const nav = useNavigation();
  const [memoryName, setMemoryName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(themes.light); // Default to light theme

  // Load theme from AsyncStorage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('theme');
        if (storedTheme && themes[storedTheme]) {
          setCurrentTheme(themes[storedTheme]);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    const fetchFriends = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get(`${API_URL}/getFriends`, { headers: { token } });
        setFriendsList(response.data);
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    fetchFriends();
  }, []);

  useEffect(() => {
    if (showSearch && searchQuery) {
      if (searchTimeout) clearTimeout(searchTimeout);
      setSearchTimeout(
        setTimeout(() => {
          const results = friendsList.filter((friend) =>
            friend.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setSearchResults(results);
        }, 500)
      );
    } else {
      setSearchResults([]);
    }
    return () => clearTimeout(searchTimeout);
  }, [searchQuery, showSearch, friendsList]);

  const toggleFriendSelection = (friend) => {
    if (selectedFriends.some((f) => f._id === friend._id)) {
      setSelectedFriends(selectedFriends.filter((f) => f._id !== friend._id));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  const removeSelectedFriend = (friendToRemove) => {
    setSelectedFriends(selectedFriends.filter((friend) => friend._id !== friendToRemove._id));
  };

  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const taggedFriendIds = selectedFriends.map((friend) => friend._id).join(',');

      const response = await axios.post(
        `${API_URL}/uploadMemory`,
        { title: memoryName, taggedFriends: taggedFriendIds, timelineEvents: [] },
        { headers: { token: token } }
      );

      console.log('Memory uploaded:', response.data);
      nav.goBack();
    } catch (error) {
      console.error('Error uploading memory:', error);
    }
  };

  const renderSearchResultItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.searchResultItem,
        { borderBottomColor: currentTheme.secondary },
        selectedFriends.some((f) => f._id === item._id) && { backgroundColor: currentTheme.accent },
      ]}
      onPress={() => toggleFriendSelection(item)}
    >
      <Image source={{ uri: item.profilePic }} style={[styles.profilePic, { borderColor: currentTheme.accent }]} />
      <Text style={[styles.searchResultName, { color: currentTheme.text }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderSelectedFriend = ({ item }) => (
    <TouchableOpacity
      style={[styles.selectedFriend, { backgroundColor: currentTheme.secondary }]}
      onPress={() => removeSelectedFriend(item)}
    >
      <Image source={{ uri: item.profilePic }} style={styles.selectedFriendPic} />
      <Text style={[styles.selectedFriendName, { color: currentTheme.text }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Text style={[styles.title, { color: currentTheme.text }]}>Create a Memory</Text>

      <TextInput
        style={[styles.input, { backgroundColor: currentTheme.background, color: currentTheme.text, borderColor: currentTheme.secondary }]}
        placeholder="Memory Title"
        placeholderTextColor={currentTheme.secondary}
        value={memoryName}
        onChangeText={setMemoryName}
      />

      <Text style={[styles.label, { color: currentTheme.text }]}>Tag Friends (Optional)</Text>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: currentTheme.primary }]}
        onPress={() => setShowSearch(!showSearch)}
      >
        <Text style={[styles.addButtonText, { color: currentTheme.background }]}>
          {showSearch ? 'Hide Search' : 'Add Friends'}
        </Text>
      </TouchableOpacity>

      {showSearch && (
        <View>
          <TextInput
            style={[styles.searchInput, { backgroundColor: currentTheme.background, color: currentTheme.text, borderColor: currentTheme.secondary }]}
            placeholder="Search Friends"
            placeholderTextColor={currentTheme.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <FlatList
            data={searchResults}
            renderItem={renderSearchResultItem}
            keyExtractor={(item) => item._id}
            style={styles.searchResultsList}
          />
        </View>
      )}

      <FlatList
        data={selectedFriends}
        renderItem={renderSelectedFriend}
        keyExtractor={(item) => item._id}
        horizontal
        style={styles.selectedFriendsHorizontalList}
      />

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: currentTheme.primary }]}
        onPress={handleSubmit}
      >
        <Text style={[styles.submitButtonText, { color: currentTheme.background }]}>Create Memory</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  addButton: {
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  addButtonText: {
    fontWeight: 'bold',
  },
  searchInput: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
  },
  selectedResultItem: {}, // Kept for potential future styling
  searchResultName: {
    marginLeft: 10,
  },
  profilePic: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 5,
    borderWidth: 2,
  },
  selectedFriendsHorizontalList: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  selectedFriend: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 5,
    marginRight: 5,
    marginBottom: 5,
  },
  selectedFriendName: {
    marginLeft: 5,
  },
  selectedFriendPic: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  submitButton: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});