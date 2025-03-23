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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
} from 'lucide-react-native';

const API_URL = 'https://radiantbackend.onrender.com';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memoryCount, setMemoryCount] = useState(0);
  const [createdMemories, setCreatedMemories] = useState([]);
  const [taggedMemories, setTaggedMemories] = useState([]);
  const [activeTab, setActiveTab] = useState('memories');

  useEffect(() => {
    const loadUser = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('Login');
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/profile`, {
          headers: { token },
        });
        setUser(res.data);
        setMemoryCount(res.data.memoryCount || 0);
        setCreatedMemories(res.data.createdMemories || []);
        setTaggedMemories(res.data.taggedMemories || []);
        const friendsRes = await axios.get(`${API_URL}/getFriends`, {
          headers: { token },
        });
        setFriends(friendsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [navigation]);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header with Back Button & Settings */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Homepage')}
        >
          <ChevronLeft size={24} color="#5271FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Settings size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Cover Photo */}
        <View style={styles.coverPhotoContainer}>
          {user?.coverPhoto ? (
            <Image source={{ uri: user.coverPhoto }} style={styles.coverPhoto} />
          ) : (
            <View style={[styles.coverPhoto, { backgroundColor: '#000' }]} />
          )}
          <TouchableOpacity style={styles.editCoverPhotoButton}>
            <Edit3 size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfoContainer}>
          <View style={styles.profileAvatarContainer}>
            <Image
              source={{ uri: user?.profilePic || 'https://via.placeholder.com/150' }}
              style={styles.profileAvatar}
            />
            <TouchableOpacity style={styles.editAvatarButton}>
              <Edit3 size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileUsername}>
              {user?.instagramUsername
                ? user.instagramUsername
                : '@' + (user?.username || '')}
            </Text>
            <Text style={styles.profileBio}>"{user?.bio || 'No bio added'}"</Text>
            <Text style={styles.profileBio}><Text style={{ fontWeight: 'bold' }}>Relationship:</Text> {user?.relationshipStatus || 'Prefer Not To Tell'}</Text>
            <Text style={styles.profileBio}><Text style={{ fontWeight: 'bold' }}>Class & Sec:</Text> {user?.class || 'Not '} {user?.section || 'Listed'}</Text>

            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatNumber}>{memoryCount}</Text>
                <Text style={styles.profileStatLabel}>Memories</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatNumber}>{friends.length}</Text>
                <Text style={styles.profileStatLabel}>Friends</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={() => navigation.navigate('EditProfile')} // Add this line
            >
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Friends Section */}
        <View style={styles.friendsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Friends</Text>
            <TouchableOpacity onPress={() => navigation.navigate('FriendsList')}>
              <Text style={styles.sectionViewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={friends}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.friendItem}>
                <Image
                  source={{ uri: item.profilePic || 'https://via.placeholder.com/150' }}
                  style={styles.friendAvatar}
                />
                <Text style={styles.friendName}>{item.name}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item._id || item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.friendsList}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'memories' && styles.activeTab]}
            onPress={() => setActiveTab('memories')}
          >
            <Text style={[styles.tabText, activeTab === 'memories' && styles.activeTabText]}>
              Memories
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'tagged' && styles.activeTab]}
            onPress={() => setActiveTab('tagged')}
          >
            <Text style={[styles.tabText, activeTab === 'tagged' && styles.activeTabText]}>
              Tagged
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
            onPress={() => setActiveTab('saved')}
          >
            <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>
              Saved
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
            onPress={() => setActiveTab('calendar')}
          >
            <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>
              Timeline
            </Text>
          </TouchableOpacity>
        </View>

        {/* Memory Grid */}
        {activeTab === 'memories' ? (
          <FlatList
            data={createdMemories}
            renderItem={renderMemoryGridItem}
            keyExtractor={(item) => item._id}
            numColumns={3}
            key="memories-3"  // Unique key for 3-column layout
            style={styles.memoryGridContainer}
          />
        ) : activeTab === 'tagged' ? (
          <FlatList
            data={taggedMemories}
            renderItem={renderMemoryGridItem}
            keyExtractor={(item) => item._id}
            numColumns={3}
            key="tagged-3"  // Unique key for 3-column layout
            style={styles.memoryGridContainer}
          />
        ) : (
          <View style={styles.emptyTabContainer}>
            <Text style={styles.emptyTabText}>No content to display yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Homepage')}>
          <Home size={24} color="#5271FF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SearchScreen')}>
          <Search size={24} color="#777" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.createButton]} onPress={() => navigation.navigate('MakeMemoryScreen')}>
          <PlusSquare size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MemeFeedScreen')}>
          <Video size={24} color="#777" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Image source={{ uri: user?.profilePic || 'https://via.placeholder.com/24' }} style={styles.navProfilePic} />
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
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#5271FF' },
  settingsButton: { padding: 4, backgroundColor: '#f0f0f0', borderRadius: 20 },
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
  editProfileButton: {
    backgroundColor: '#f0f2f5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  editProfileButtonText: { color: '#333', fontWeight: '600', fontSize: 14 },
  friendsSection: { marginTop: 24, paddingTop: 16, paddingBottom: 8, borderTopWidth: 8, borderTopColor: '#f0f2f5' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  sectionViewAll: { color: '#5271FF', fontSize: 14 },
  friendsList: { paddingLeft: 16 },
  friendItem: { alignItems: 'center', marginRight: 16, width: 70 },
  friendAvatar: { width: 60, height: 60, borderRadius: 30 },
  friendName: { fontSize: 12, textAlign: 'center', color: '#333' },
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
  emptyTabContainer: { height: 200, justifyContent: 'center', alignItems: 'center' },
  emptyTabText: { color: '#777', fontSize: 16 },
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