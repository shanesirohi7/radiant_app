import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import io from 'socket.io-client';
import { Dimensions } from 'react-native';
import {
  Bell,
  ChevronDown,
  MessageCircle,
  Home,
  Search,
  PlusSquare,
  Video,
  User,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  MoreVertical,
  UserPlus,
  UserMinus,
} from 'lucide-react-native';

const API_URL = 'https://radiantbackend.onrender.com';

// Define themes directly in the file
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

// Helper to get relative time
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

const App = ({ onLogout }) => {
  const nav = useNavigation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [memories, setMemories] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(themes.light); // Default to light theme
  const [showMemories, setShowMemories] = useState(false);

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
    const loadUser = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        nav.replace('Login');
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/profile`, { headers: { token } });
        if (!res.data || !res.data._id || res.data._id === 'null') {
          console.error('Invalid user data:', res.data);
          Alert.alert('Error', 'Failed to load valid user data.');
          return;
        }
        setUser(res.data);
        setCurrentUserId(res.data._id);
        fetchFriendRequests(token);
        fetchProfileMemories(token);
        fetchOnlineFriends(token);
        fetchConversations(token, res.data._id);

        const newSocket = io(API_URL, {
          query: { userId: res.data._id },
        });
        setSocket(newSocket);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOnlineFriends();
    }
  }, [user]);

  const renderRecentConversationItem = ({ item }) => {
    const otherParticipant = item.participants.find((p) => p._id !== currentUserId) || item.participants[0];
    const name = otherParticipant?.name || 'Unknown';
    const profilePic = otherParticipant?.profilePic || 'https://via.placeholder.com/150';
    const lastMsg = item.lastMessage ? item.lastMessage.content : 'No messages yet';
    const lastMsgTime = item.lastMessage ? new Date(item.lastMessage.createdAt) : new Date(item.updatedAt);
    const formattedTime = lastMsgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const unreadMessages =
      item.messages?.filter(
        (msg) =>
          msg.senderId._id !== currentUserId &&
          (!msg.readBy || !msg.readBy.includes(currentUserId))
      ).length || 0;

    return (
      <TouchableOpacity
        style={styles.recentConversationBlock}
        onPress={() =>
          nav.navigate('Chat', {
            conversationId: item._id,
            participants: item.participants,
            name: name,
          })
        }
      >
        <View style={styles.blockAvatarContainer}>
          <Image source={{ uri: profilePic }} style={styles.blockAvatar} />
          {otherParticipant?.online && <View style={[styles.blockOnlineIndicator, { backgroundColor: currentTheme.accent }]} />}
          {unreadMessages > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: currentTheme.secondary }]}>
              <Text style={[styles.unreadBadgeText, { color: currentTheme.background }]}>{unreadMessages}</Text>
            </View>
          )}
        </View>
        <View style={styles.blockInfo}>
          <View style={styles.blockHeader}>
            <Text style={[styles.blockName, { color: currentTheme.text }]} numberOfLines={1}>{name}</Text>
            <Text style={[styles.blockTime, { color: currentTheme.text }]}>{formattedTime}</Text>
          </View>
          <Text style={[styles.blockLastMsg, { color: currentTheme.text }]} numberOfLines={1}>{lastMsg}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const fetchConversations = async (token, userId) => {
    try {
      const convRes = await axios.get(`${API_URL}/conversations`, { headers: { token } });
      let convs = convRes.data;
      const convsWithLastMsg = await Promise.all(
        convs.map(async (convo) => {
          try {
            const msgRes = await axios.get(`${API_URL}/messages/${convo._id}`, { headers: { token } });
            if (msgRes.data.length > 0) {
              convo.lastMessage = msgRes.data[msgRes.data.length - 1];
            }
          } catch (error) {
            console.error(`Error fetching messages for convo ${convo._id}:`, error);
          }
          return convo;
        })
      );
      const sortedConvs = convsWithLastMsg
        .sort((a, b) => {
          const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt);
          const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt);
          return timeB - timeA;
        })
        .slice(0, 5);
      setConversations(sortedConvs);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      Alert.alert('Error', 'Failed to fetch conversations');
    }
  };

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    const pageNum = Math.floor(contentOffset / viewSize);
    setCurrentImageIndex(pageNum);
  };

  const fetchOnlineFriends = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/onlineFriends`, { headers: { token } });
      setOnlineFriends(response.data);
    } catch (error) {
      console.error('Error fetching online friends:', error);
      Alert.alert('Error', 'Failed to fetch online friends');
    }
  };

  const fetchFriendRequests = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/getFriendRequests`, { headers: { token } });
      setFriendRequests(response.data);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      Alert.alert('Error', 'Failed to fetch friend requests');
    }
  };

  const unseenConvosCount = conversations.filter(
    (item) =>
      item.lastMessage &&
      item.lastMessage.senderId._id !== currentUserId &&
      (!item.lastMessage.readBy || !item.lastMessage.readBy.includes(currentUserId))
  ).length;

  const fetchProfileMemories = async (token) => {
    try {
      const profileResponse = await axios.get(`${API_URL}/profile`, { headers: { token } });
      const { createdMemories, taggedMemories } = profileResponse.data;
      const friendsMemoriesResponse = await axios.get(`${API_URL}/friendsMemories`, { headers: { token } });
      const friendsMemories = friendsMemoriesResponse.data;
      const allMemories = [...createdMemories, ...taggedMemories, ...friendsMemories];
      const seenMemoryIds = new Set();
      const uniqueMemories = allMemories
        .filter((memory) => {
          if (seenMemoryIds.has(memory._id)) return false;
          seenMemoryIds.add(memory._id);
          return true;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMemories(uniqueMemories);
    } catch (error) {
      console.error('Error fetching memories:', error);
      Alert.alert('Error', 'Failed to fetch memories');
    }
  };

  const handleAcceptRequest = async (friendId) => {
    const token = await AsyncStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/acceptFriendRequest`, { friendId }, { headers: { token } });
      fetchFriendRequests(token);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (friendId) => {
    const token = await AsyncStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/rejectFriendRequest`, { friendId }, { headers: { token } });
      fetchFriendRequests(token);
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      Alert.alert('Error', 'Failed to reject friend request');
    }
  };

  const handleLogout = async () => {
    onLogout();
  };

  // Simple function to switch themes (you can call this from a button later)
  const switchTheme = async (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themes[themeName]);
      await AsyncStorage.setItem('theme', themeName);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  const hasNotifications = friendRequests.length > 0;

  const renderOnlineFriend = ({ item }) => (
    <TouchableOpacity style={styles.friendItem}>
      <View style={styles.friendAvatarContainer}>
        <Image source={{ uri: item.profilePic }} style={[styles.friendAvatar, { borderColor: currentTheme.accent }]} />
        {item.online && <View style={[styles.onlineIndicator, { backgroundColor: currentTheme.accent }]} />}
      </View>
      <Text style={[styles.friendName, { color: currentTheme.text }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderConversationItem = ({ item }) => {
    const otherParticipant =
      item.participants.find((p) => p._id !== currentUserId) || item.participants[0];
    const name = otherParticipant?.name || 'Unknown';
    const profilePic = otherParticipant?.profilePic || 'https://via.placeholder.com/150';
    const lastMsgTime = item.lastMessage ? new Date(item.lastMessage.createdAt) : new Date(item.updatedAt);
    const formattedTime = lastMsgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageText =
      item.lastMessage && item.lastMessage.sender === currentUserId ? item.lastMessage.content : '';

    return (
      <TouchableOpacity
        style={[styles.convoBlock, { backgroundColor: currentTheme.secondary }]}
        onPress={() =>
          nav.navigate('Chat', {
            conversationId: item._id,
            participants: item.participants,
            name,
          })
        }
      >
        <Image source={{ uri: profilePic }} style={styles.convoAvatar} />
        <Text style={[styles.convoName, { color: currentTheme.text }]} numberOfLines={1}>{name}</Text>
        {messageText ? (
          <Text style={[styles.convoMsg, { color: currentTheme.text }]} numberOfLines={1}>{messageText}</Text>
        ) : null}
        <Text style={[styles.convoTime, { color: currentTheme.text }]}>{formattedTime}</Text>
      </TouchableOpacity>
    );
  };

  const renderMemoryItem = ({ item }) => (
    <View style={styles.memoryItem}>
      <View style={styles.memoryHeader}>
        <View style={styles.memoryUser}>
          <Image source={{ uri: item.author.profilePic }} style={styles.memoryUserAvatar} />
          <View>
            <Text style={[styles.memoryUserName, { color: currentTheme.text }]}>{item.author.name}</Text>
            <View style={styles.memoryInfo}>
              <Text style={[styles.memoryTitle, { color: currentTheme.text }]}>{item.title}</Text>
              <Text style={[styles.memoryDot, { color: currentTheme.text }]}>•</Text>
              <Text style={[styles.memoryContributors, { color: currentTheme.text }]}>
                with {item.taggedFriends.slice(0, 2).map((friend) => friend.name).join(', ')}
                {item.taggedFriends.length > 2 ? ` +${item.taggedFriends.length - 2} more` : ''}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity>
          <MoreVertical size={20} color={currentTheme.text} />
        </TouchableOpacity>
      </View>

      {item.photos && item.photos.length > 0 && (
        <View>
          <FlatList
            ref={flatListRef}
            data={item.photos}
            renderItem={({ item: photo }) => (
              <Image
                source={{ uri: photo }}
                style={[styles.memoryImage, { width: Dimensions.get('window').width }]}
              />
            )}
            keyExtractor={(photo, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleScroll}
          />
          <View style={styles.imageIndicatorContainer}>
            {item.photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.imageIndicatorDot,
                  { backgroundColor: currentTheme.secondary },
                  index === currentImageIndex && { backgroundColor: currentTheme.primary },
                ]}
              />
            ))}
          </View>
        </View>
      )}

      <View style={styles.memoryActions}>
        <View style={styles.memoryActionsLeft}>
          <TouchableOpacity style={styles.memoryAction}>
            <Heart size={24} color={currentTheme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.memoryAction}>
            <MessageSquare size={24} color={currentTheme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.memoryAction}>
            <Share2 size={24} color={currentTheme.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Bookmark size={24} color={currentTheme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.memoryStats}>
        <Text style={[styles.memoryLikes, { color: currentTheme.text }]}>0 likes</Text>
        <TouchableOpacity>
          <Text style={[styles.memoryViewComments, { color: currentTheme.text }]}>View all 0 comments</Text>
        </TouchableOpacity>
        <Text style={[styles.memoryTimestamp, { color: currentTheme.text }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar
        barStyle={currentTheme.text === '#000000' ? 'dark-content' : 'light-content'}
        backgroundColor={currentTheme.background}
      />

      <View style={[styles.header, { borderBottomColor: currentTheme.secondary }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.primary }]}>Radiant</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            style={styles.headerIcon}
            onPress={() => setShowNotifications(true)}
          >
            <Bell size={30} color={currentTheme.text} />
            {hasNotifications && <View style={[styles.notificationBadge, { backgroundColor: currentTheme.accent }]} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={() => nav.navigate('Mainmessage')}>
            <MessageCircle size={30} color={currentTheme.text} />
            {unseenConvosCount > 0 && (
              <View style={[styles.headerBadge, { backgroundColor: currentTheme.secondary }]}>
                <Text style={[styles.headerBadgeText, { color: currentTheme.background }]}>{unseenConvosCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Online Friends</Text>
          <FlatList
            data={onlineFriends}
            renderItem={renderOnlineFriend}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.friendsList}
          />
        </View>

        <View style={styles.section}>
  <TouchableOpacity 
    style={styles.sectionHeader}
    onPress={() => setShowMemories(!showMemories)}
  >
    <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Memories ({memories.length})</Text>
    <ChevronDown 
      size={20} 
      color={currentTheme.text} 
      style={[styles.dropdownIcon, showMemories && styles.dropdownIconRotated]}
    />
  </TouchableOpacity>
  {showMemories && (
    <FlatList
      data={memories}
      renderItem={renderMemoryItem}
      keyExtractor={(item) => item._id}
      scrollEnabled={false}
      style={styles.memoriesList}
    />
  )}
</View>

        {/* Add a simple theme switcher for testing */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Switch Theme</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 }}>
            {Object.keys(themes).map((themeName) => (
              <TouchableOpacity
                key={themeName}
                style={[styles.themeButton, { backgroundColor: currentTheme.secondary }]}
                onPress={() => switchTheme(themeName)}
              >
                <Text style={[styles.themeButtonText, { color: currentTheme.text }]}>
                  {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomNav, { backgroundColor: currentTheme.background, borderTopColor: currentTheme.secondary }]}>
        <TouchableOpacity style={styles.navItem}>
          <Home size={24} color={currentTheme.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => nav.navigate('SearchScreen')}>
          <Search size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, styles.createButton, { backgroundColor: currentTheme.primary }]}
          onPress={() => nav.navigate('MakeMemoryScreen')}
        >
          <PlusSquare size={24} color={currentTheme.background} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => nav.navigate('MemeFeedScreen')}>
          <Video size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => nav.navigate('Profile')}>
          <Image
            source={{ uri: user?.profilePic || 'https://via.placeholder.com/24' }}
            style={[styles.navProfilePic, { borderColor: currentTheme.accent }]}
          />
        </TouchableOpacity>
      </View>

      <Modal visible={showNotifications} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.background }]}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowNotifications(false)}>
              <Text style={[styles.closeButtonText, { color: currentTheme.primary }]}>Close</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Notifications</Text>
            <FlatList
              data={friendRequests}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={[styles.notificationItem, { backgroundColor: currentTheme.secondary }]}>
                  <Image
                    source={{ uri: item.profilePic }}
                    style={[styles.notificationProfilePic, { borderColor: currentTheme.accent }]}
                  />
                  <View style={styles.notificationUserInfo}>
                    <Text style={[styles.notificationUserName, { color: currentTheme.text }]}>{item.name}</Text>
                  </View>
                  <View style={styles.notificationButtons}>
                    <TouchableOpacity
                      style={[styles.acceptButton, { backgroundColor: currentTheme.primary }]}
                      onPress={() => handleAcceptRequest(item._id)}
                    >
                      <UserPlus size={18} color={currentTheme.background} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rejectButton, { backgroundColor: currentTheme.accent }]}
                      onPress={() => handleRejectRequest(item._id)}
                    >
                      <UserMinus size={18} color={currentTheme.background} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navProfilePic: {
    width: 28,
    height: 28,
    borderRadius: 20,
    borderWidth: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    padding: 20,
    borderRadius: 15,
    width: '85%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
  },
  notificationProfilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
  },
  notificationUserInfo: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    right: 15,
    marginBottom: 12,
  },
  dropdownIcon: {
    transition: 'transform 0.3s',
  },
  dropdownIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  notificationUserName: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationButtons: {
    flexDirection: 'row',
  },
  acceptButton: {
    padding: 8,
    borderRadius: 15,
    marginRight: 8,
  },
  rejectButton: {
    padding: 8,
    borderRadius: 15,
  },
  recentConversationBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  horizontalList: {
    paddingHorizontal: 10,
    marginTop: 10,
  },
  convoBlock: {
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    width: 180,
    alignItems: 'center',
  },
  convoAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 5,
  },
  convoName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  convoMsg: {
    fontSize: 14,
    marginBottom: 5,
  },
  convoTime: {
    fontSize: 12,
  },
  headerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  blockAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  blockAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
  },
  blockOnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  blockInfo: {
    flex: 1,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  blockName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  blockTime: {
    fontSize: 13,
  },
  blockLastMsg: {
    fontSize: 14,
  },
  unreadBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  headerIcon: {
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  friendsList: {
    paddingLeft: 16,
  },
  friendItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  friendAvatarContainer: {
    position: 'relative',
  },
  friendAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  friendName: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  memoriesList: {
    marginTop: 8,
  },
  memoryItem: {
    marginBottom: 24,
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  memoryUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memoryUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memoryUserName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  memoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  memoryTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  memoryDot: {
    marginHorizontal: 4,
  },
  memoryContributors: {
    fontSize: 13,
  },
  memoryImage: {
    width: '100%',
    height: 360,
    resizeMode: 'cover',
  },
  memoryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  memoryActionsLeft: {
    flexDirection: 'row',
  },
  memoryAction: {
    marginRight: 16,
  },
  memoryStats: {
    paddingHorizontal: 16,
  },
  memoryLikes: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 14,
  },
  memoryViewComments: {
    marginBottom: 4,
    fontSize: 14,
  },
  memoryTimestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  imageIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  themeButton: {
    padding: 10,
    borderRadius: 5,
    margin: 5,
  },
  themeButtonText: {
    fontSize: 16,
  },
});

export default App;