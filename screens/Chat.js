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
import { Send, ChevronLeft, MoreVertical, Camera, Mic, Smile, Image as ImageIcon, Check, CheckCheck } from 'lucide-react-native';
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
  const [typing, setTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

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
      fetchUserProfile().then(() => fetchMessages());
    }
  }, [token]);
  

  // Existing fetchUserProfile function
  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile`, { headers: { token } });
      if (!res.data?._id) throw new Error("Invalid profile data received.");
  
      userId.current = res.data._id;
      console.log("✅ userId.current set:", userId.current);
  
      if (participants && participants.length > 0) {
        const other = participants.find((p) => p._id !== userId.current) || participants[0];
        setOtherUser(other);
      }
  
      connectSocket();
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
    }
  };
  

  // Existing fetchMessages function
  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/messages/${conversationId}`, {
        headers: { token },
      });
      setMessages(res.data);
      
      // Mark all unread messages as read
      if (res.data.length > 0) {
        markMessagesAsRead(res.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };
  const getSenderId = (msg) =>
    typeof msg.senderId === "object" && msg.senderId !== null
      ? msg.senderId._id
      : msg.senderId;
  
      const markMessagesAsRead = async (msgs) => {
        if (!token) {
          console.error("Token is missing in markMessagesAsRead");
          return;
        }
      
        if (!userId.current) {
          console.error("❌ userId.current is NULL, preventing marking as read!");
          return;
        }
      
        try {
          if (typeof getSenderId !== "function") {
            console.error("getSenderId is not defined!");
            return;
          }
      
          const unreadMessageIds = msgs
            .filter((msg) => {
              const senderId = getSenderId(msg);
              console.log("Checking message:", msg._id, "Sender:", senderId, "User:", userId.current);
              return (
                senderId !== userId.current && // ✅ Only messages sent by the OTHER user
                (!msg.readBy || !msg.readBy.includes(userId.current))
              );
            })
            .map((msg) => msg._id);
      
          if (unreadMessageIds.length === 0) return;
      
          console.log("✅ Marking as read (filtered):", unreadMessageIds);
      
          await axios.post(
            `${API_URL}/messages/markAsRead`,
            { messageIds: unreadMessageIds },
            { headers: { 'Content-Type': 'application/json', token } }
          );
      
          if (socket) {
            socket.emit("messages_read", {
              conversationId,
              messageIds: unreadMessageIds,
              readBy: userId.current,
            });
          }
        } catch (error) {
          console.error("❌ Error marking messages as read:", error);
        }
      };
      
  
  // Modified socket connection function
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
      setMessages(prevMessages => [...prevMessages, message]);
    
      newSocket.emit('message_delivered', {
        messageId: message._id,
        userId: userId.current,
        conversationId
      });
    
      // Only mark messages as read if they're not from you
      if (message.senderId._id !== userId.current) {
        markMessagesAsRead([message]);
      }
    });
    
    
    
    // Listen for delivery status updates
    newSocket.on('message_delivered_update', ({ messageId, deliveredTo }) => {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId 
            ? { ...msg, deliveredTo: [...(msg.deliveredTo || []), ...deliveredTo] }
            : msg
        )
      );
    });
    
    // Listen for read status updates
    newSocket.on('message_read_update', ({ messageId, readBy }) => {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId 
            ? { ...msg, readBy: [...(msg.readBy || []), ...readBy] }
            : msg
        )
      );
    });
    
    // Listen for typing indicators
    newSocket.on('typing_indicator', ({ userId: typingUserId, isTyping }) => {
      if (typingUserId !== userId.current) {
        setTyping(isTyping);
      }
    });

    setSocket(newSocket);
  };

  // Handle typing indicator
  const handleTyping = (text) => {
    setNewMessage(text);
    
    if (socket) {
      socket.emit('typing_indicator', {
        conversationId,
        userId: userId.current,
        isTyping: text.length > 0
      });
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set a new timeout to stop the typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_indicator', {
          conversationId,
          userId: userId.current,
          isTyping: false
        });
      }, 2000);
    }
  };

  // Existing socket cleanup effect
  useEffect(() => {
    return () => {
      if (socket) {
        socket.emit('leave_conversation', conversationId);
        socket.disconnect();
        console.log('Socket disconnected from ChatScreen');
      }
      
      // Clear typing timeout on unmount
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, conversationId]);

  const sendMessage = async () => {
    if (newMessage.trim()) {
        try {
            const response = await axios.post(
                `${API_URL}/messages/${conversationId}`,
                { content: newMessage },
                { headers: { token } }
            );

            setNewMessage('');

            // Do NOT add the message to state immediately
            // The backend will emit 'new_message', and that will update the state.

            if (socket) {
                socket.emit('typing_indicator', {
                    conversationId,
                    userId: userId.current,
                    isTyping: false
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }
};


  // Updated render message function with delivery/read status
  const renderMessage = ({ item }) => {
    const isSent = item.senderId._id === userId.current;
    const time = new Date(item.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    // Determine message status for sent messages
    let statusIcon = null;
    if (isSent) {
      const isDelivered = item.deliveredTo && 
                         otherUser && 
                         item.deliveredTo.includes(otherUser._id);
      const isRead = item.readBy && 
                     otherUser && 
                     item.readBy.includes(otherUser._id);
      
      if (isRead) {
        statusIcon = <CheckCheck width={14} height={14} color="#0084ff" />;
      } else if (isDelivered) {
        statusIcon = <Check width={14} height={14} color="#8e8e8e" />;
      } else {
        statusIcon = <Check width={14} height={14} color="#8e8e8e" />;
      }
    }
    
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
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>{time}</Text>
            {isSent && statusIcon}
          </View>
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
              <Text style={styles.status}>
                {typing ? 'Typing...' : otherUser.online ? 'Active now' : 'Offline'}
              </Text>
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
              onChangeText={handleTyping}
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
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 11,
    color: '#65676b',
    marginRight: 4,
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