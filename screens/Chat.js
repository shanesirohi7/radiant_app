import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity, Image } from 'react-native';
import axios from 'axios';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Send } from 'lucide-react-native';

const API_URL = 'https://radiantbackend.onrender.com';

const Chat = ({ route }) => {
    const { conversationId, participants } = route.params;
    const [messages, setMessages] = useState();
    const [newMessage, setNewMessage] = useState('');
    const [token, setToken] = useState(null);
    const [socket, setSocket] = useState(null);
    const flatListRef = useRef(null);
    const userId = useRef(null);

    useEffect(() => {
        const fetchToken = async () => {
            const storedToken = await AsyncStorage.getItem('token');
            if (storedToken) {
                setToken(storedToken);
            }
        };
        fetchToken();
    },);

    useEffect(() => {
        if (token) {
            fetchMessages();
            fetchUserId();
            connectSocket();
        }
    }, [token]);

    const fetchUserId = async () => {
        try {
            const response = await axios.get(`${API_URL}/profile`, { headers: { token } });
            userId.current = response.data._id;
        } catch (error) {
            console.error('Error fetching user ID:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            const response = await axios.get(`${API_URL}/messages/${conversationId}`, {
                headers: { token },
            });
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const connectSocket = () => {
        const newSocket = io(API_URL, {
            query: { userId: userId.current },
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            newSocket.emit('join_conversation', conversationId);
        });

        newSocket.on('new_message', (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });
        setSocket(newSocket);
        return () => {
            if (newSocket) {
                newSocket.emit('leave_conversation', conversationId);
                newSocket.disconnect();
                console.log('Socket disconnected from Chat');
            }
        };
    };

    const sendMessage = async () => {
        if (newMessage.trim()) {
            try {
                await axios.post(
                    `${API_URL}/messages/${conversationId}`,
                    { content: newMessage },
                    { headers: { token } }
                );
                setNewMessage('');
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    const renderMessage = ({ item }) => (
        <View style={[styles.messageBubble, item.senderId._id === userId.current ? styles.sentMessage : styles.receivedMessage]}>
            <Text style={styles.messageText}>{item.content}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item._id}
                style={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type a message..."
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                    <Send color="blue" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    messagesList: { flex: 1, padding: 10 },
    messageBubble: {
        maxWidth: '70%',
        padding: 10,
        borderRadius: 20,
        marginBottom: 10,
    },
    sentMessage: { alignSelf: 'flex-end', backgroundColor: '#DCF8C6' },
    receivedMessage: { alignSelf: 'flex-start', backgroundColor: '#E8E8E8' },
    messageText: { fontSize: 16 },
    inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#E8E8E8' },
    input: { flex: 1, borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 20, padding: 10, marginRight: 10 },
    sendButton: { justifyContent: 'center', alignItems: 'center' },
});

export default Chat;