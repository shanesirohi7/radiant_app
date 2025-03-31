import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  Settings,
  Edit3,
  ChevronLeft,
  Home,
  Search,
  PlusSquare,
  Video,
  UserPlus,
  UserCheck,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  PlusSquare as PlusSquareIcon,
} from 'lucide-react-native';

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

export default function OtherProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId: otherUserId } = route.params;

  const [userData, setUserData] = useState(null);
  const [memories, setMemories] = useState([]);
  const [activeTab, setActiveTab] = useState('memories');
  const [isFriend, setIsFriend] = useState(false);
  const [mutualFriends, setMutualFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(themes.light); // Default to light theme

  const createdMemories = memories.filter((memory) => memory.author._id === otherUserId);
  const taggedMemories = memories.filter((memory) => memory.author._id !== otherUserId);
  const totalMemoryCount = memories.length;

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
    const loadProfileData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          navigation.replace('Login');
          return;
        }
        const profileRes = await axios.get(`${API_URL}/otherProfile/${otherUserId}`);
        setUserData(profileRes.data);

        const memoriesRes = await axios.get(`${API_URL}/userMemories/${otherUserId}`, {
          headers: { token },
        });
        setMemories(memoriesRes.data);

        const friendsRes = await axios.get(`${API_URL}/getFriends`, { headers: { token } });
        const myFriends = friendsRes.data || [];
        const mutual = myFriends.filter((friend) =>
          profileRes.data.friends?.some((f) => f._id === friend._id)
        );
        setMutualFriends(mutual);
        setIsFriend(myFriends.some((friend) => friend._id === otherUserId));
      } catch (error) {
        console.error('Error fetching other profile:', error);
        Alert.alert('Error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [otherUserId, navigation]);

  useEffect(() => {
    if (activeTab === 'memories' && createdMemories.length === 0 && taggedMemories.length > 0) {
      setActiveTab('shared');
    }
  }, [createdMemories, taggedMemories, activeTab]);

  const sendFriendRequest = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      await axios.post(
        `${API_URL}/sendFriendRequest`,
        { friendId: otherUserId },
        { headers: { token } }
      );
      Alert.alert('Success', 'Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const renderMemoryGridItem = ({ item }) => {
    const latestPhoto = item.photos && item.photos.length > 0
      ? item.photos[item.photos.length - 1]
      : 'https://via.placeholder.com/150';

    return (
      <TouchableOpacity
        style={styles.memoryGridItem}
        onPress={() => navigation.navigate('MemoryDetailScreen', { memory: item })}
      >
        <Image source={{ uri: latestPhoto }} style={styles.memoryGridImage} />
        <Text style={[styles.memoryGridTitle, { color: currentTheme.text }]}>
          {item.title || 'Untitled Memory'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={[styles.loadingText, { color: currentTheme.text }]}>Loading profile...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.errorText, { color: currentTheme.text }]}>Profile not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.background }]}>
      <StatusBar
        barStyle={currentTheme.text === '#000000' ? 'dark-content' : 'light-content'}
        backgroundColor={currentTheme.background}
      />
      <View style={[styles.header, { borderBottomColor: currentTheme.secondary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={currentTheme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>{userData.name}</Text>
        <TouchableOpacity style={[styles.moreButton, { backgroundColor: currentTheme.secondary }]}>
          <MoreHorizontal size={24} color={currentTheme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.coverPhotoContainer}>
          {userData?.coverPhoto ? (
            <Image source={{ uri: userData.coverPhoto }} style={styles.coverPhoto} />
          ) : (
            <View style={[styles.coverPhoto, { backgroundColor: currentTheme.secondary }]} />
          )}
        </View>

        <View style={styles.profileInfoContainer}>
          <View style={styles.profileAvatarContainer}>
            <Image
              source={{ uri: userData?.profilePic || 'https://via.placeholder.com/150' }}
              style={[styles.profileAvatar, { borderColor: currentTheme.accent }]}
            />
          </View>
          <View style={styles.profileDetails}>
            <Text style={[styles.profileName, { color: currentTheme.text }]}>{userData.name}</Text>
            <Text style={[styles.profileUsername, { color: currentTheme.text }]}>
              {userData.instagramUsername ? userData.instagramUsername : '@' + (userData.username || '')}
            </Text>
            <Text style={[styles.profileBio, { color: currentTheme.text }]}>
              {userData.bio || 'No bio added'}
            </Text>
            <Text style={[styles.profileBio, { color: currentTheme.text }]}>
              <Text style={{ fontWeight: 'bold' }}>Relationship:</Text>{' '}
              {userData?.relationshipStatus || 'Prefer Not To Tell'}
            </Text>
            <Text style={[styles.profileBio, { color: currentTheme.text }]}>
              <Text style={{ fontWeight: 'bold' }}>Class & Sec:</Text>{' '}
              {userData?.class || 'Not '} {userData?.section || 'Listed'}
            </Text>
            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <Text style={[styles.profileStatNumber, { color: currentTheme.text }]}>{totalMemoryCount}</Text>
                <Text style={[styles.profileStatLabel, { color: currentTheme.text }]}>Memories</Text>
              </View>
              <View style={[styles.profileStatDivider, { backgroundColor: currentTheme.secondary }]} />
              <View style={styles.profileStat}>
                <Text style={[styles.profileStatNumber, { color: currentTheme.text }]}>{mutualFriends.length}</Text>
                <Text style={[styles.profileStatLabel, { color: currentTheme.text }]}>Mutual Friends</Text>
              </View>
            </View>

            <View style={styles.actionButtonsContainer}>
              {isFriend ? (
                <TouchableOpacity
                  style={[styles.primaryActionButton, { backgroundColor: currentTheme.primary }]}
                  onPress={() => navigation.navigate('Chat', { userId: userData._id })}
                >
                  <MessageCircle size={18} color={currentTheme.background} style={styles.actionButtonIcon} />
                  <Text style={[styles.primaryActionButtonText, { color: currentTheme.background }]}>
                    Message
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.primaryActionButton, { backgroundColor: currentTheme.primary }]}
                  onPress={sendFriendRequest}
                >
                  <UserPlus size={18} color={currentTheme.background} style={styles.actionButtonIcon} />
                  <Text style={[styles.primaryActionButtonText, { color: currentTheme.background }]}>
                    Add Friend
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.secondaryActionButton, { backgroundColor: currentTheme.secondary }]}>
                {isFriend ? (
                  <>
                    <UserCheck size={18} color={currentTheme.text} style={styles.actionButtonIcon} />
                    <Text style={[styles.secondaryActionButtonText, { color: currentTheme.text }]}>Friends</Text>
                  </>
                ) : (
                  <>
                    <Bookmark size={18} color={currentTheme.text} style={styles.actionButtonIcon} />
                    <Text style={[styles.secondaryActionButtonText, { color: currentTheme.text }]}>Follow</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryActionButton, { backgroundColor: currentTheme.secondary }]}>
                <Share2 size={18} color={currentTheme.text} style={styles.actionButtonIcon} />
                <Text style={[styles.secondaryActionButtonText, { color: currentTheme.text }]}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {mutualFriends.length > 0 && (
          <View style={[styles.friendsSection, { borderTopColor: currentTheme.secondary }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Mutual Friends</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('MutualFriendsList', { userId: userData._id })}
              >
                <Text style={[styles.sectionViewAll, { color: currentTheme.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={mutualFriends}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.friendItem}
                  onPress={() => navigation.push('OtherProfileScreen', { userId: item._id })}
                >
                  <Image
                    source={{ uri: item.profilePic || 'https://via.placeholder.com/150' }}
                    style={[styles.friendAvatar, { borderColor: currentTheme.accent }]}
                  />
                  <Text style={[styles.friendName, { color: currentTheme.text }]}>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.friendsList}
            />
          </View>
        )}

        <View style={[styles.tabsContainer, { borderTopColor: currentTheme.secondary, borderBottomColor: currentTheme.secondary }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'memories' && styles.activeTab]}
            onPress={() => setActiveTab('memories')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'memories' && { color: currentTheme.primary },
                { color: currentTheme.text },
              ]}
            >
              Memories
            </Text>
          </TouchableOpacity>
          {isFriend && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'shared' && styles.activeTab]}
              onPress={() => setActiveTab('shared')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'shared' && { color: currentTheme.primary },
                  { color: currentTheme.text },
                ]}
              >
                Shared
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {activeTab === 'memories' ? (
          isFriend ? (
            createdMemories.length > 0 ? (
              <FlatList
                data={createdMemories}
                renderItem={renderMemoryGridItem}
                keyExtractor={(item) => item._id}
                numColumns={3}
                key="memories-3"
                style={styles.memoryGridContainer}
              />
            ) : (
              <View style={styles.emptyTabContainer}>
                <Text style={[styles.emptyTabText, { color: currentTheme.text }]}>
                  No memories created by this user
                </Text>
              </View>
            )
          ) : (
            <View style={styles.emptyTabContainer}>
              <Text style={[styles.emptyTabText, { color: currentTheme.text }]}>
                Add as a friend to see memories
              </Text>
              <TouchableOpacity
                style={[styles.addFriendButton, { backgroundColor: currentTheme.primary }]}
                onPress={sendFriendRequest}
              >
                <UserPlus size={18} color={currentTheme.background} style={{ marginRight: 8 }} />
                <Text style={[styles.addFriendButtonText, { color: currentTheme.background }]}>
                  Add Friend
                </Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          isFriend && taggedMemories.length > 0 ? (
            <FlatList
              data={taggedMemories}
              renderItem={renderMemoryGridItem}
              keyExtractor={(item) => item._id}
              numColumns={3}
              key="shared-3"
              style={styles.memoryGridContainer}
            />
          ) : (
            <View style={styles.emptyTabContainer}>
              <Text style={[styles.emptyTabText, { color: currentTheme.text }]}>
                No shared memories yet
              </Text>
              <TouchableOpacity
                style={[styles.createSharedButton, { backgroundColor: currentTheme.primary }]}
                onPress={() => navigation.navigate('CreateSharedMemory', { friend: userData })}
              >
                <PlusSquareIcon size={18} color={currentTheme.background} style={{ marginRight: 8 }} />
                <Text style={[styles.createSharedButtonText, { color: currentTheme.background }]}>
                  Create Shared Memory
                </Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </ScrollView>

      <View style={[styles.bottomNav, { backgroundColor: currentTheme.background, borderTopColor: currentTheme.secondary }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Homepage')}>
          <Home size={24} color={currentTheme.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SearchScreen')}>
          <Search size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, styles.createButton, { backgroundColor: currentTheme.primary }]}
          onPress={() => navigation.navigate('MakeMemoryScreen')}
        >
          <PlusSquareIcon size={24} color={currentTheme.background} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MemeFeedScreen')}>
          <Video size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Image
            source={{ uri: userData?.profilePic || 'https://via.placeholder.com/24' }}
            style={[styles.navProfilePic, { borderColor: currentTheme.accent }]}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  moreButton: { padding: 4, borderRadius: 20 },
  content: { flex: 1 },
  coverPhotoContainer: { height: 180, position: 'relative' },
  coverPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  editCoverPhotoButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfoContainer: { paddingHorizontal: 16, paddingTop: 12, position: 'relative' },
  profileAvatarContainer: { position: 'absolute', top: -50, left: 16, zIndex: 1 },
  profileAvatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4 },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileDetails: { marginLeft: 116, marginTop: 10 },
  profileName: { fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  profileUsername: { fontSize: 14, marginBottom: 8 },
  profileBio: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  profileStats: { flexDirection: 'row', marginBottom: 16 },
  profileStat: { alignItems: 'center', marginRight: 24 },
  profileStatNumber: { fontSize: 18, fontWeight: 'bold' },
  profileStatLabel: { fontSize: 12, marginTop: 2 },
  profileStatDivider: { width: 1, height: '80%', marginRight: 24 },
  actionButtonsContainer: { flexDirection: 'row', marginBottom: 16 },
  primaryActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  primaryActionButtonText: { fontWeight: '600', fontSize: 14 },
  secondaryActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  secondaryActionButtonText: { fontWeight: '600', fontSize: 14 },
  actionButtonIcon: { marginRight: 6 },
  friendsSection: { marginTop: 24, paddingTop: 16, paddingBottom: 8, borderTopWidth: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  sectionViewAll: { fontSize: 14 },
  friendsList: { paddingLeft: 16 },
  friendItem: { alignItems: 'center', marginRight: 16, width: 70 },
  friendAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2 },
  friendName: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  tabsContainer: { flexDirection: 'row', marginTop: 24, borderTopWidth: 1, borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  activeTab: { borderBottomWidth: 2 },
  tabText: { fontSize: 14 },
  activeTabText: { fontWeight: '500' },
  memoryGridContainer: {
    paddingHorizontal: 5,
    paddingTop: 10,
  },
  memoryGridItem: {
    flex: 1 / 3,
    margin: 3,
    alignItems: 'center',
    maxWidth: '33%',
  },
  memoryGridImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 5,
  },
  memoryGridTitle: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyTabContainer: { height: 200, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTabText: { fontSize: 16, marginBottom: 16 },
  addFriendButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFriendButtonText: { fontWeight: '600' },
  createSharedButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createSharedButtonText: { fontWeight: '600' },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navProfilePic: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
});