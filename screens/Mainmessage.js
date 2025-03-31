import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MessageCircle, X, Search, Plus } from 'lucide-react-native';

const API_URL = 'https://radiantbackend.onrender.com';

// Define themes directly in the file (same as other screens)
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

// Helper to get relative time (e.g., "5h ago")
const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  const intervals = [
    { label: 'y', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'w', seconds: 604800 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'm', seconds: 60 },
  ];
  for (let interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count}${interval.label}`;
    }
  }
  return 'now';
};

const Mainmessage = () => {
  const [conversations, setConversations] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [friends, setFriends] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(themes.light); // Default to light theme
  const navigation = useNavigation();

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('Login');
        return;
      }
      // Get current user profile
      const profileRes = await axios.get(`${API_URL}/profile`, {
        headers: { token },
      });
      if (profileRes.data && profileRes.data._id) {
        setCurrentUserId(profileRes.data._id);
      }
      // Fetch conversations
      const convRes = await axios.get(`${API_URL}/conversations`, {
        headers: { token },
      });
      let convs = convRes.data;
      // For each conversation, get its latest message
      const convsWithLastMsg = await Promise.all(
        convs.map(async (convo) => {
          try {
            const msgRes = await axios.get(`${API_URL}/messages/${convo._id}`, {
              headers: { token },
            });
            if (msgRes.data.length > 0) {
              convo.lastMessage = msgRes.data[msgRes.data.length - 1];
              
              // Check if message is unread
              if (convo.lastMessage.sender !== profileRes.data._id && !convo.lastMessage.read) {
                convo.hasUnread = true;
              }
            }
          } catch (error) {
            console.error(`Error fetching messages for convo ${convo._id}:`, error);
          }
          return convo;
        })
      );
      
      // Sort conversations by last message time
      const sortedConvs = convsWithLastMsg.sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt);
        const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt);
        return timeB - timeA;
      });
      
      setConversations(sortedConvs);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch friends list to start new conversation
  const fetchFriends = async () => {
    try {
      setLoadingFriends(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('Login');
        return;
      }
      const res = await axios.get(`${API_URL}/getFriends`, { headers: { token } });
      setFriends(res.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refresh the conversations list when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  // When new conversation modal opens, fetch friends if not already loaded
  const openModal = () => {
    setModalVisible(true);
    fetchFriends();
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Start a new conversation with selected friend
  const startConversation = async (friend) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('Login');
        return;
      }
      // Create conversation; ensure current user is added
      const res = await axios.post(
        `${API_URL}/conversations`,
        { participantIds: [friend._id] },
        { headers: { token } }
      );
      const conversation = res.data;
      setModalVisible(false);
      navigation.navigate('Chat', {
        conversationId: conversation._id,
        participants: [friend], // You can expand if needed
        name: friend.name,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const renderConversationItem = ({ item }) => {
    const otherParticipant =
      item.participants.find((p) => p._id !== currentUserId) || item.participants[0];
    const name = otherParticipant?.name || 'Unknown';
    const profilePic = otherParticipant?.profilePic || 'https://via.placeholder.com/150';
    
    const lastMsg = item.lastMessage ? item.lastMessage.content : 'Start a conversation...';
    const lastMsgTime = item.lastMessage ? new Date(item.lastMessage.createdAt) : new Date(item.updatedAt);
    
    // Show real time instead of "now"
    const formattedTime = lastMsgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Check if the last message was sent by the current user
    const isFromMe = item.lastMessage && item.lastMessage.sender === currentUserId;

    // Count unread messages
    const unreadMessages = item.messages?.filter((msg) => !msg.readBy.includes(currentUserId)).length || 0;

    let displayMessage;
    let showBlueTick = false;

    if (isFromMe) {
      displayMessage = `Delivered · ${formattedTime}`;
    } else if (unreadMessages > 0) {
      displayMessage = `+${unreadMessages} messages`;
      showBlueTick = true; // Show blue tick for unread messages
    } else {
      displayMessage = lastMsg; // Just show the last message if it's been seen
    }

    return (
      <TouchableOpacity
        style={[styles.conversationItem, { backgroundColor: currentTheme.background, borderBottomColor: currentTheme.secondary }]}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: item._id,
            participants: item.participants,
            name: name,
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: profilePic }}
            style={[styles.avatar, { borderColor: currentTheme.accent }]}
          />
          {otherParticipant?.online && <View style={[styles.onlineIndicator, { backgroundColor: currentTheme.accent }]} />}
        </View>
        <View style={styles.messageInfo}>
          <View style={styles.headerRow}>
            <Text style={[styles.name, { color: currentTheme.text }]}>{name}</Text>
            <Text style={[styles.time, { color: currentTheme.text }]}>{formattedTime}</Text>
          </View>
          <View style={styles.messageRow}>
            <Text style={[styles.lastMessage, { color: currentTheme.text }]} numberOfLines={1}>
              {displayMessage}
            </Text>
            {showBlueTick && <View style={[styles.unreadDot, { backgroundColor: currentTheme.primary }]} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFriend = ({ item }) => (
    <TouchableOpacity
      style={[styles.friendItem, { borderBottomColor: currentTheme.secondary }]}
      onPress={() => startConversation(item)}
      activeOpacity={0.7}
    >
      <View style={styles.friendAvatarContainer}>
        <Image
          source={{ uri: item.profilePic || 'https://via.placeholder.com/50' }}
          style={styles.friendAvatar}
        />
        {item.online && <View style={[styles.friendOnlineIndicator, { backgroundColor: currentTheme.accent }]} />}
      </View>
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { color: currentTheme.text }]}>{item.name}</Text>
        <Text style={[styles.friendStatus, { color: currentTheme.text }]}>
          {item.online ? 'Online' : 'Offline'}
        </Text>
      </View>
      <View style={[styles.startChatButton, { backgroundColor: currentTheme.secondary }]}>
        <MessageCircle size={16} color={currentTheme.primary} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MessageCircle size={60} color={currentTheme.secondary} />
      <Text style={[styles.emptyText, { color: currentTheme.text }]}>No conversations yet</Text>
      <Text style={[styles.emptySubtext, { color: currentTheme.text }]}>
        Start messaging with your friends!
      </Text>
      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: currentTheme.primary }]}
        onPress={openModal}
      >
        <Text style={[styles.startButtonText, { color: currentTheme.background }]}>
          Start a chat
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.searchContainer}>
      <TouchableOpacity
        style={[styles.searchBar, { backgroundColor: currentTheme.secondary }]}
        onPress={() => navigation.navigate('SearchUsers')}
      >
        <Search size={16} color={currentTheme.text} />
        <Text style={[styles.searchText, { color: currentTheme.text }]}>Search</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar
        barStyle={currentTheme.text === '#000000' ? 'dark-content' : 'light-content'}
        backgroundColor={currentTheme.background}
      />
      <View style={[styles.header, { backgroundColor: currentTheme.background, borderBottomColor: currentTheme.secondary }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Messages</Text>
        <TouchableOpacity
          style={[styles.newMessageButton, { backgroundColor: currentTheme.primary }]}
          onPress={openModal}
        >
          <Plus size={20} color={currentTheme.background} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        renderItem={renderConversationItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={[
          styles.listContent,
          conversations.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={currentTheme.primary}
            colors={[currentTheme.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: currentTheme.primary }]}
        onPress={openModal}
      >
        <MessageCircle size={24} color={currentTheme.background} />
      </TouchableOpacity>

      {/* Modal for Friends List */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: currentTheme.secondary }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>New Message</Text>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: currentTheme.secondary }]}
              onPress={() => setModalVisible(false)}
            >
              <X size={20} color={currentTheme.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.modalSearchContainer, { borderBottomColor: currentTheme.secondary }]}>
            <TouchableOpacity style={[styles.modalSearchBar, { backgroundColor: currentTheme.secondary }]}>
              <Search size={16} color={currentTheme.text} />
              <Text style={[styles.searchText, { color: currentTheme.text }]}>Search friends</Text>
            </TouchableOpacity>
          </View>

          {loadingFriends ? (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color={currentTheme.primary} />
            </View>
          ) : friends.length === 0 ? (
            <View style={styles.noFriendsContainer}>
              <Text style={[styles.noFriendsText, { color: currentTheme.text }]}>No friends found</Text>
              <Text style={[styles.noFriendsSubtext, { color: currentTheme.text }]}>
                Add some friends to start messaging
              </Text>
              <TouchableOpacity
                style={[styles.addFriendsButton, { backgroundColor: currentTheme.primary }]}
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate('FindFriends');
                }}
              >
                <Text style={[styles.addFriendsButtonText, { color: currentTheme.background }]}>
                  Find Friends
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => item._id}
              renderItem={renderFriend}
              contentContainerStyle={styles.modalListContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  newMessageButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5271FF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  searchText: {
    marginLeft: 8,
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  messageInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  time: {
    fontSize: 13,
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 12,
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '500',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5271FF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  startButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 24,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSearchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalListContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  friendAvatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  friendOnlineIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: 14,
  },
  startChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noFriendsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noFriendsText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  noFriendsSubtext: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  addFriendsButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  addFriendsButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Mainmessage;