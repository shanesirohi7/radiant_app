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

  const createdMemories = memories.filter(memory => memory.author._id === otherUserId);
  const taggedMemories = memories.filter(memory => memory.author._id !== otherUserId);
  const totalMemoryCount = memories.length;

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
        const mutual = myFriends.filter(friend =>
          profileRes.data.friends?.some(f => f._id === friend._id)
        );
        setMutualFriends(mutual);
        setIsFriend(myFriends.some(friend => friend._id === otherUserId));
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
        <Image
          source={{ uri: latestPhoto }}
          style={styles.memoryGridImage}
        />
        <Text style={styles.memoryGridTitle}>{item.title || 'Untitled Memory'}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5271FF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Profile not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#5271FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userData.name}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <MoreHorizontal size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.coverPhotoContainer}>
          {userData?.coverPhoto ? (
            <Image source={{ uri: userData.coverPhoto }} style={styles.coverPhoto} />
          ) : (
            <View style={[styles.coverPhoto, { backgroundColor: '#000' }]} />
          )}
        </View>

        <View style={styles.profileInfoContainer}>
          <View style={styles.profileAvatarContainer}>
            <Image
              source={{ uri: userData?.profilePic || 'https://via.placeholder.com/150' }}
              style={styles.profileAvatar}
            />
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{userData.name}</Text>
            <Text style={styles.profileUsername}>
              {userData.instagramUsername ? userData.instagramUsername : '@' + (userData.username || '')}
            </Text>
            <Text style={styles.profileBio}>{userData.bio || 'No bio added'}</Text>
            <Text style={styles.profileBio}><Text style={{ fontWeight: 'bold' }}>Relationship:</Text> {userData?.relationshipStatus || 'Prefer Not To Tell'}</Text>
                        <Text style={styles.profileBio}><Text style={{ fontWeight: 'bold' }}>Class & Sec:</Text> {userData?.class || 'Not '} {userData?.section || 'Listed'}</Text>
            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatNumber}>{totalMemoryCount}</Text>
                <Text style={styles.profileStatLabel}>Memories</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatNumber}>{mutualFriends.length}</Text>
                <Text style={styles.profileStatLabel}>Mutual Friends</Text>
              </View>
            </View>

            <View style={styles.actionButtonsContainer}>
              {isFriend ? (
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => navigation.navigate('Chat', { userId: userData._id })}
                >
                  <MessageCircle size={18} color="#fff" style={styles.actionButtonIcon} />
                  <Text style={styles.primaryActionButtonText}>Message</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.primaryActionButton} onPress={sendFriendRequest}>
                  <UserPlus size={18} color="#fff" style={styles.actionButtonIcon} />
                  <Text style={styles.primaryActionButtonText}>Add Friend</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.secondaryActionButton}>
                {isFriend ? (
                  <>
                    <UserCheck size={18} color="#555" style={styles.actionButtonIcon} />
                    <Text style={styles.secondaryActionButtonText}>Friends</Text>
                  </>
                ) : (
                  <>
                    <Bookmark size={18} color="#555" style={styles.actionButtonIcon} />
                    <Text style={styles.secondaryActionButtonText}>Follow</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryActionButton}>
                <Share2 size={18} color="#555" style={styles.actionButtonIcon} />
                <Text style={styles.secondaryActionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {mutualFriends.length > 0 && (
          <View style={styles.friendsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mutual Friends</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MutualFriendsList', { userId: userData._id })}>
                <Text style={styles.sectionViewAll}>View All</Text>
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
                    style={styles.friendAvatar}
                  />
                  <Text style={styles.friendName}>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.friendsList}
            />
          </View>
        )}

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'memories' && styles.activeTab]}
            onPress={() => setActiveTab('memories')}
          >
            <Text style={[styles.tabText, activeTab === 'memories' && styles.activeTabText]}>
              Memories
            </Text>
          </TouchableOpacity>
          {isFriend && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'shared' && styles.activeTab]}
              onPress={() => setActiveTab('shared')}
            >
              <Text style={[styles.tabText, activeTab === 'shared' && styles.activeTabText]}>
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
                <Text style={styles.emptyTabText}>No memories created by this user</Text>
              </View>
            )
          ) : (
            <View style={styles.emptyTabContainer}>
              <Text style={styles.emptyTabText}>Add as a friend to see memories</Text>
              <TouchableOpacity style={styles.addFriendButton} onPress={sendFriendRequest}>
                <UserPlus size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.addFriendButtonText}>Add Friend</Text>
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
              <Text style={styles.emptyTabText}>No shared memories yet</Text>
              <TouchableOpacity style={styles.createSharedButton} onPress={() => navigation.navigate('CreateSharedMemory', { friend: userData })}>
                <PlusSquareIcon size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.createSharedButtonText}>Create Shared Memory</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Homepage')}>
          <Home size={24} color="#5271FF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SearchScreen')}>
          <Search size={24} color="#777" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.createButton]} onPress={() => navigation.navigate('MakeMemoryScreen')}>
          <PlusSquareIcon size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MemeFeedScreen')}>
          <Video size={24} color="#777" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Image source={{ uri: userData?.profilePic || 'https://via.placeholder.com/24' }} style={styles.navProfilePic} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#333', fontSize: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  moreButton: { padding: 4, backgroundColor: '#f0f0f0', borderRadius: 20 },
  content: { flex: 1 },
  coverPhotoContainer: { height: 180, position: 'relative' },
  coverPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  editCoverPhotoButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfoContainer: { paddingHorizontal: 16, paddingTop: 12, position: 'relative' },
  profileAvatarContainer: { position: 'absolute', top: -50, left: 16, zIndex: 1 },
  profileAvatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#5271FF' },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#5271FF',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileDetails: { marginLeft: 116, marginTop: 10 },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  profileUsername: { fontSize: 14, color: '#777', marginBottom: 8 },
  profileBio: { fontSize: 14, color: '#555', marginBottom: 16, lineHeight: 20 },
  profileStats: { flexDirection: 'row', marginBottom: 16 },
  profileStat: { alignItems: 'center', marginRight: 24 },
  profileStatNumber: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  profileStatLabel: { fontSize: 12, color: '#777', marginTop: 2 },
  profileStatDivider: { width: 1, height: '80%', backgroundColor: '#eee', marginRight: 24 },
  actionButtonsContainer: { flexDirection: 'row', marginBottom: 16 },
  primaryActionButton: {
    backgroundColor: '#5271FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  primaryActionButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  secondaryActionButton: {
    backgroundColor: '#f0f2f5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  secondaryActionButtonText: { color: '#333', fontWeight: '600', fontSize: 14 },
  actionButtonIcon: { marginRight: 6 },
  friendsSection: { marginTop: 24, paddingTop: 16, paddingBottom: 8, borderTopWidth: 8, borderTopColor: '#f0f2f5' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  sectionViewAll: { color: '#5271FF', fontSize: 14 },
  friendsList: { paddingLeft: 16 },
  friendItem: { alignItems: 'center', marginRight: 16, width: 70 },
  friendAvatar: { width: 60, height: 60, borderRadius: 30 },
  friendName: { fontSize: 12, textAlign: 'center', color: '#333', marginTop: 4 },
  tabsContainer: { flexDirection: 'row', marginTop: 24, borderTopWidth: 1, borderTopColor: '#eee', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#5271FF' },
  tabText: { color: '#777', fontSize: 14 },
  activeTabText: { color: '#5271FF', fontWeight: '500' },
  memoryGridContainer: { 
    paddingHorizontal: 5,
    paddingTop: 10,
  },
  memoryGridItem: { 
    flex: 1/3,
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
    color: '#333', 
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyTabContainer: { height: 200, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTabText: { color: '#777', fontSize: 16, marginBottom: 16 },
  addFriendButton: {
    backgroundColor: '#5271FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFriendButtonText: { color: '#fff', fontWeight: '600' },
  createSharedButton: {
    backgroundColor: '#5271FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createSharedButtonText: { color: '#fff', fontWeight: '600' },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  createButton: {
    backgroundColor: '#5271FF',
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
    borderColor: '#6c5ce7',
  },
});