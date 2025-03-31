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
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Send, ChevronLeft, MoreVertical, Camera, Mic, Smile, Image as ImageIcon, Check, CheckCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import themes from './Theme';

const API_URL = 'https://radiantbackend.onrender.com';

// Sound playback function with dynamic file loading
const playSound = async (type) => {
  let soundFile;
  const storedSendSound = await AsyncStorage.getItem('sendSound') || 'Send1';
  const storedReceiveSound = await AsyncStorage.getItem('receiveSound') || 'Receive1';

  const sendSounds = {
    'Send1': require('../assets/Send/Send1.mp3'),
    'Send2': require('../assets/Send/Send2.mp3'),
    'Send3': require('../assets/Send/Send3.mp3'),
    'Send4': require('../assets/Send/Send4.mp3'),
    'Send5': require('../assets/Send/Send5.mp3'),
  };

  const receiveSounds = {
    'Receive1': require('../assets/Receive/Receive1.mp3'),
    'Receive2': require('../assets/Receive/Receive2.mp3'),
    'Receive3': require('../assets/Receive/Receive3.mp3'),
    'Receive4': require('../assets/Receive/Receive4.mp3'),
    'Receive5': require('../assets/Receive/Receive5.mp3'),
    'Receive6': require('../assets/Receive/Receive6.mp3'),
  };

  if (type === 'send') {
    soundFile = sendSounds[storedSendSound] || sendSounds['Send1'];
  } else if (type === 'receive') {
    soundFile = receiveSounds[storedReceiveSound] || receiveSounds['Receive1'];
  }

  try {
    const { sound } = await Audio.Sound.createAsync(soundFile);
    await sound.playAsync();
  } catch (error) {
    console.error(`Error playing ${type} sound:`, error);
  }
};

const Chat = ({ route }) => {
  const { conversationId, participants, conversationName } = route.params;
  const navigation = useNavigation();
  const [token, setToken] = useState(null);
  const [messages, setMessages] = useState([]);
  const [displayMessages, setDisplayMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(themes.light);
  const [uploading, setUploading] = useState(false);
  const userId = useRef(null);
  const flatListRef = useRef(null);
  const [typing, setTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

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

  // Fetch token
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

  // Fetch profile and messages
  useEffect(() => {
    if (token) {
      fetchUserProfile().then(() => fetchMessages());
    }
  }, [token]);

  // Scroll to bottom after displayMessages updates
  useEffect(() => {
    if (displayMessages.length > 0 && flatListRef.current) {
      // Add a slight delay to ensure the FlatList is fully rendered
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [displayMessages]);

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile`, { headers: { token } });
      if (!res.data?._id) throw new Error("Invalid profile data received.");
      userId.current = res.data._id;
      if (participants && participants.length > 0) {
        const other = participants.find((p) => p._id !== userId.current) || participants[0];
        setOtherUser(other);
      }
      connectSocket();
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/messages/${conversationId}`, {
        headers: { token },
      });
      const allMessages = res.data;
      setMessages(allMessages);
      const latestMessages = allMessages.slice(-10);
      setDisplayMessages(latestMessages);
      if (allMessages.length > 0) {
        markMessagesAsRead(allMessages);
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
    if (!token || !userId.current) return;
    try {
      const unreadMessageIds = msgs
        .filter((msg) => getSenderId(msg) !== userId.current && (!msg.readBy || !msg.readBy.includes(userId.current)))
        .map((msg) => msg._id);
      if (unreadMessageIds.length === 0) return;
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

  const connectSocket = () => {
    if (!userId.current || userId.current === 'null') return;
    const newSocket = io(API_URL, {
      query: { userId: userId.current },
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_conversation', conversationId);
    });

    newSocket.on('new_message', (message) => {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, message];
        setDisplayMessages(updatedMessages.slice(-10));
        return updatedMessages;
      });
      newSocket.emit('message_delivered', {
        messageId: message._id,
        userId: userId.current,
        conversationId,
      });
      if (message.senderId._id !== userId.current) {
        playSound('receive');
        markMessagesAsRead([message]);
      }
    });

    newSocket.on('message_delivered_update', ({ messageId, deliveredTo }) => {
      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((msg) =>
          msg._id === messageId ? { ...msg, deliveredTo: [...(msg.deliveredTo || []), ...deliveredTo] } : msg
        );
        setDisplayMessages(updatedMessages.slice(-10));
        return updatedMessages;
      });
    });

    newSocket.on('message_read_update', ({ messageId, readBy }) => {
      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((msg) =>
          msg._id === messageId ? { ...msg, readBy: [...(msg.readBy || []), ...readBy] } : msg
        );
        setDisplayMessages(updatedMessages.slice(-10));
        return updatedMessages;
      });
    });

    newSocket.on('typing_indicator', ({ userId: typingUserId, isTyping }) => {
      if (typingUserId !== userId.current) {
        setTyping(isTyping);
      }
    });

    setSocket(newSocket);
  };

  const handleTyping = (text) => {
    setNewMessage(text);
    if (socket) {
      socket.emit('typing_indicator', {
        conversationId,
        userId: userId.current,
        isTyping: text.length > 0,
      });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_indicator', {
          conversationId,
          userId: userId.current,
          isTyping: false,
        });
      }, 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (socket) {
        socket.emit('leave_conversation', conversationId);
        socket.disconnect();
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, conversationId]);

  const sendMessage = async (content) => {
    try {
      await axios.post(
        `${API_URL}/messages/${conversationId}`,
        { content },
        { headers: { token } }
      );
      setNewMessage('');
      if (socket) {
        socket.emit('typing_indicator', {
          conversationId,
          userId: userId.current,
          isTyping: false,
        });
      }
      await playSound('send');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert("Send Failed", "Could not send the message.");
    }
  };

  // Pick image from library
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

  // Upload image to Cloudinary
  const uploadImage = async (uri) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", { uri, type: "image/jpeg", name: "chat-image.jpg" });
      formData.append("upload_preset", "radiant_preset");

      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dzljsey6i/image/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const imageUrl = response.data.secure_url;
      await sendMessage(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert("Upload Failed", "Could not upload the image.");
    } finally {
      setUploading(false);
    }
  };

  // Updated renderMessage to handle images
  const renderMessage = ({ item }) => {
    const isSent = item.senderId._id === userId.current;
    const time = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isImage = item.content.startsWith('http') && (item.content.endsWith('.jpg') || item.content.endsWith('.jpeg') || item.content.endsWith('.png'));

    let statusIcon = null;
    if (isSent) {
      const isDelivered = item.deliveredTo && otherUser && item.deliveredTo.includes(otherUser._id);
      const isRead = item.readBy && otherUser && item.readBy.includes(otherUser._id);
      statusIcon = isRead ? (
        <CheckCheck width={14} height={14} color={currentTheme.accent} />
      ) : isDelivered ? (
        <Check width={14} height={14} color={currentTheme.text} />
      ) : (
        <Check width={14} height={14} color={currentTheme.text} />
      );
    }

    return (
      <View style={isSent ? styles.sentContainer : styles.receivedContainer}>
        {!isSent && (
          <Image
            source={{ uri: item.senderId.profilePic || otherUser?.profilePic || 'https://via.placeholder.com/40' }}
            style={styles.avatarImage}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isSent ? styles.myMessage : styles.theirMessage,
            { backgroundColor: isSent ? currentTheme.primary : currentTheme.secondary },
          ]}
        >
          {isImage ? (
            <Image
              source={{ uri: item.content }}
              style={styles.messageImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={[styles.messageText, { color: currentTheme.background }]}>{item.content}</Text>
          )}
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, { color: currentTheme.background }]}>{time}</Text>
            {isSent && statusIcon}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { backgroundColor: currentTheme.background, borderBottomColor: currentTheme.secondary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft width={24} height={24} color={currentTheme.text} />
        </TouchableOpacity>
        {otherUser && (
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: otherUser.profilePic || 'https://via.placeholder.com/40' }}
              style={[styles.avatar, { borderColor: currentTheme.accent }]}
            />
            <View>
              <Text style={[styles.username, { color: currentTheme.text }]}>{otherUser.name}</Text>
              <Text style={[styles.status, { color: currentTheme.text }]}>
                {typing ? 'Typing...' : otherUser.online ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        )}
        <TouchableOpacity>
          <MoreVertical width={24} height={24} color={currentTheme.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={displayMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messagesContainer}
        inverted={false}
        style={styles.messagesList}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.inputContainer, { backgroundColor: currentTheme.background, borderTopColor: currentTheme.secondary }]}>
          <TouchableOpacity style={styles.iconButton} onPress={pickImage} disabled={uploading}>
            <Camera width={24} height={24} color={uploading ? '#999' : currentTheme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={pickImage} disabled={uploading}>
            <ImageIcon width={24} height={24} color={uploading ? '#999' : currentTheme.text} />
          </TouchableOpacity>
          <View style={[styles.textInputContainer, { backgroundColor: currentTheme.secondary }]}>
            <TextInput
              style={[styles.input, { color: currentTheme.text }]}
              placeholder="Message..."
              placeholderTextColor={currentTheme.text}
              value={newMessage}
              onChangeText={handleTyping}
              multiline
            />
            <TouchableOpacity style={styles.emojiButton}>
              <Smile width={20} height={20} color={currentTheme.text} />
            </TouchableOpacity>
          </View>
          {newMessage.trim().length > 0 ? (
            <TouchableOpacity style={[styles.sendButton, { backgroundColor: currentTheme.primary }]} onPress={() => sendMessage(newMessage)}>
              <Send width={24} height={24} color={currentTheme.background} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.iconButton}>
              <Mic width={24} height={24} color={currentTheme.text} />
            </TouchableOpacity>
          )}
          {uploading && <ActivityIndicator size="small" color={currentTheme.primary} style={{ marginLeft: 8 }} />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderWidth: 2,
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
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
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
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 11,
    marginRight: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
  },
  iconButton: {
    padding: 8,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    marginHorizontal: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  emojiButton: {
    padding: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Chat;