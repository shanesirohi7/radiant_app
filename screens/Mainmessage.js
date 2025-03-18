import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, FlatList, Image, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Plus } from 'lucide-react-native';

const API_URL = 'https://radiantbackend.onrender.com';

const Mainmessage = ({ route }) => {
    const userName = route.params?.userName || 'User';
    const navigation = useNavigation();
    const [conversations, setConversations] = useState([]);
    const [token, setToken] = useState(null);
    const [showFriendsModal, setShowFriendsModal] = useState(false);
    const [friends, setFriends] = useState([]);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const fetchToken = async () => {
            const storedToken = await AsyncStorage.getItem('token');
            if (storedToken) {
                setToken(storedToken);
            }
        };
        fetchToken();
    }, []);

    useEffect(() => {
        if (token) {
            fetchConversations();
            fetchFriendsAndSetUserId(); // Combined function
        }
    }, [token]);

    const fetchFriendsAndSetUserId = async () => {
        try {
            const response = await axios.get(`${API_URL}/getFriends`, { headers: { token } });
            setFriends(response.data);
            if (response.data.length > 0) {
              setUserId(response.data[0]._id);
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    };

    const fetchConversations = async () => {
        try {
            const response = await axios.get(`${API_URL}/conversations`, {
                headers: { token },
            });
            setConversations(response.data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const fetchFriends = async () => {
        try {
            const response = await axios.get(`${API_URL}/getFriends`, { headers: { token } });
            setFriends(response.data);
            setShowFriendsModal(true);
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    };

    const handleFriendSelection = async (friend) => {
        setShowFriendsModal(false);
        try {
            if (!userId || !friend?._id) {
                console.error("Invalid userId or friendId:", userId, friend?._id);
                return;
            }
    
            const existingConversation = conversations.find(conv =>
                conv.participants.some(p => p._id === userId) &&
                conv.participants.some(p => p._id === friend._id)
            );
    
            if (existingConversation) {
                navigation.navigate('Chat', {
                    conversationId: existingConversation._id,
                    participants: existingConversation.participants,
                });
            } else {
                console.log("Creating new conversation with:", userId, friend._id);
                const response = await axios.post(
                    `${API_URL}/conversations`,
                    { participantIds: [userId, friend._id] },  // ✅ Corrected key
                    { headers: { token } }
                );
                console.log("New conversation created:", response.data);
                navigation.navigate('Chat', {
                    conversationId: response.data._id,
                    participants: response.data.participants,
                });
            }
        } catch (error) {
            console.error('Error handling friend selection:', error.response?.data || error);
        }
    };
    

    const renderConversationItem = ({ item }) => (
        <TouchableOpacity
            style={styles.conversationItem}
            onPress={() =>
                navigation.navigate('Chat', {
                    conversationId: item._id,
                    participants: item.participants,
                })
            }
        >
            <Image source={{ uri: item.participants[0].profilePic }} style={styles.avatar} />
            <View style={styles.conversationDetails}>
                <View style={styles.nameRow}>
                    <Text style={styles.name}>{item.participants[0].name}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderFriendItem = ({ item }) => (
        <TouchableOpacity style={styles.friendItem} onPress={() => handleFriendSelection(item)}>
            <Image source={{ uri: item.profilePic }} style={styles.friendAvatar} />
            <Text>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View style={styles.header}>
                <Text style={styles.greeting}>Hi, {userName}!</Text>
                <TouchableOpacity style={styles.newChatButton} onPress={() => console.log('New chat button pressed')}>
                    <Plus size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {conversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <TouchableOpacity style={styles.startChatButton} onPress={fetchFriends}>
                        <Text style={styles.startChatText}>Start Chat</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderConversationItem}
                    keyExtractor={(item) => item._id}
                    style={styles.list}
                />
            )}

            <Modal visible={showFriendsModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowFriendsModal(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Select a Friend</Text>
                        <FlatList data={friends} renderItem={renderFriendItem} keyExtractor={(item) => item._id} />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greeting: { fontSize: 20, fontWeight: 'bold' },
    newChatButton: {
        width: 56, height: 56, borderRadius: 28, backgroundColor: '#3498db', justifyContent: 'center', alignItems: 'center',
    },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    startChatButton: { backgroundColor: '#3498db', padding: 16, borderRadius: 8 },
    startChatText: { color: 'white', fontSize: 18 },
    list: { flex: 1 },
    conversationItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F2', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
    conversationDetails: { flex: 1, justifyContent: 'center' },
    nameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    name: { fontSize: 16, fontWeight: '500' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%', maxHeight: '80%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    friendItem: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#F2F2F2', alignItems: 'center' },
    friendAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
    closeButton: { alignSelf: 'flex-end' },
    closeButtonText: { color: 'blue' },
});

export default Mainmessage;