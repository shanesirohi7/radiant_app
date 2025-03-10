import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

const API_URL = 'https://radiantbackend.onrender.com';

export default function MakeMemoryScreen() {
    const nav = useNavigation(); // Initialize useNavigation
    const [memoryName, setMemoryName] = useState('');
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [friendsList, setFriendsList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchTimeout, setSearchTimeout] = useState(null);

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

            const taggedFriendIds = selectedFriends.map(friend => friend._id).join(',');

            const response = await axios.post(
                `${API_URL}/uploadMemory`,
                { title: memoryName, taggedFriends: taggedFriendIds },
                { headers: { token: token } }
            );

            console.log('Memory uploaded:', response.data);
            nav.goBack(); // Navigate back after successful upload

        } catch (error) {
            console.error('Error uploading memory:', error);
        }
    };

    const renderSearchResultItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.searchResultItem, selectedFriends.some((f) => f._id === item._id) && styles.selectedResultItem]}
            onPress={() => toggleFriendSelection(item)}
        >
            <Image source={{ uri: item.profilePic }} style={styles.profilePic} />
            <Text style={styles.searchResultName}>{item.name}</Text>
        </TouchableOpacity>
    );

    const renderSelectedFriend = ({ item }) => (
        <TouchableOpacity style={styles.selectedFriend} onPress={() => removeSelectedFriend(item)}>
            <Image source={{ uri: item.profilePic }} style={styles.selectedFriendPic} />
            <Text style={styles.selectedFriendName}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Create a Memory</Text>

            <TextInput
                style={styles.input}
                placeholder="Memory Title"
                placeholderTextColor="#aaa"
                value={memoryName}
                onChangeText={setMemoryName}
            />

            <Text style={styles.label}>Tag Friends (Optional)</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowSearch(!showSearch)}>
                <Text style={styles.addButtonText}>{showSearch ? 'Hide Search' : 'Add Friends'}</Text>
            </TouchableOpacity>

            {showSearch && (
                <View>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search Friends"
                        placeholderTextColor="#aaa"
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

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Create Memory</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 15 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
    input: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 12, color: '#333', marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
    label: { fontSize: 18, fontWeight: '600', marginBottom: 8, color: '#333' },
    addButton: { backgroundColor: '#5271FF', borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 10 },
    addButtonText: { color: '#fff', fontWeight: 'bold' },
    searchInput: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 12, color: '#333', marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
    searchResultsList: { maxHeight: 200 },
    searchResultItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    selectedResultItem: { backgroundColor: '#e0f7fa' },searchResultName: { marginLeft: 10 },
    profilePic: { width: 30, height: 30, borderRadius: 15, marginRight: 5 },
    selectedFriendsHorizontalList: { flexDirection: 'row', marginBottom: 10 },
    selectedFriend: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 8, borderRadius: 5, marginRight: 5, marginBottom: 5 },
    selectedFriendName: { marginLeft: 5 },
    selectedFriendPic: { width: 20, height: 20, borderRadius: 10 },
    submitButton: { backgroundColor: '#5271FF', borderRadius: 8, padding: 15, alignItems: 'center' },
    submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});