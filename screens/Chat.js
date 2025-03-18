import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Send, ChevronLeft, MoreVertical, Camera, Mic, Smile, Image as ImageIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'https://radiantbackend.onrender.com';

const Chat = ({ route }) => {
  // Keep existing props and state management
  const { conversationId, participants, conversationName } = route.params;
  const navigation = useNavigation();
  const [token, setToken] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const userId = useRef(null);
  const flatListRef = useRef(null);

  // Existing token fetching effect
  useEffect(() => {
    const getToken = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) {
        navigation.replace('Login');
        return;
      }
      setToken(storedToken);
    };
    getToken();
  }, [navigation]);

  // Existing profile and messages fetch effect
  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Existing fetchUserProfile function
  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile`, { headers: { token } });
      userId.current = res.data._id;
      // Determine the other participant dynamically
      if (participants && participants.length > 0) {
        const other =
          participants.find((p) => p._id !== res.data._id) || participants[0];
        setOtherUser(other);
      }
      // After profile is fetched, connect socket
      connectSocket();
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Existing fetchMessages function
  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/messages/${conversationId}`, {
        headers: { token },
      });
      setMessages(res.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Existing socket connection function
  const connectSocket = () => {
    if (!userId.current || userId.current === 'null') {
      console.error('Invalid userId. Socket connection aborted.');
      return;
    }
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
  };

  // Existing socket cleanup effect
  useEffect(() => {
    return () => {
      if (socket) {
        socket.emit('leave_conversation', conversationId);
        socket.disconnect();
        console.log('Socket disconnected from ChatScreen');
      }
    };
  }, [socket, conversationId]);

  // Existing send message function
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

  // Updated render message function with new styling
  const renderMessage = ({ item }) => {
    const isSent = item.senderId._id === userId.current;
    const time = new Date(item.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    return (
      <View style={isSent ? styles.sentContainer : styles.receivedContainer}>
        {!isSent && (
          <Image
            source={{
              uri: item.senderId.profilePic || otherUser?.profilePic || 'https://via.placeholder.com/40',
            }}
            style={styles.avatarImage}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isSent ? styles.myMessage : styles.theirMessage,
          ]}
        >
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.messageTime}>{time}</Text>
        </View>
      </View>
    );
  };

  // Loading screen
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#666" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Updated with new styling */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft width={24} height={24} color="#000" />
        </TouchableOpacity>
        
        {otherUser && (
          <View style={styles.profileContainer}>
            <Image
              source={{
                uri: otherUser.profilePic || 'https://via.placeholder.com/40',
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.username}>{otherUser.name}</Text>
              <Text style={styles.status}>Active now</Text>
            </View>
          </View>
        )}
        
        <TouchableOpacity>
          <MoreVertical width={24} height={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Messages - Modified to display from bottom */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messagesContainer}
        inverted={false}  // Not inverting the list
        onContentSizeChange={() => 
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        onLayout={() => 
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        // Making the list initially show from bottom
        style={styles.messagesList}
      />

      {/* Input Bar - Updated with new styling */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.iconButton}>
            <Camera width={24} height={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <ImageIcon width={24} height={24} color="#666" />
          </TouchableOpacity>
          
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor="#999"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity style={styles.emojiButton}>
              <Smile width={20} height={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          {newMessage.trim().length > 0 ? (
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Send width={24} height={24} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.iconButton}>
              <Mic width={24} height={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 12,
    color: '#65676b',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    // These additional styles help push content to the bottom initially
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  sentContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  receivedContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  myMessage: {
    backgroundColor: '#f0f2f5',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: '#f5f5f5',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#000',
  },
  messageTime: {
    fontSize: 11,
    color: '#65676b',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  iconButton: {
    padding: 8,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 16,
    marginHorizontal: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    color: '#000',
  },
  emojiButton: {
    padding: 4,
  },
  sendButton: {
    backgroundColor: '#0084ff',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Chat;