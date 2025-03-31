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

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memoryCount, setMemoryCount] = useState(0);
  const [createdMemories, setCreatedMemories] = useState([]);
  const [taggedMemories, setTaggedMemories] = useState([]);
  const [activeTab, setActiveTab] = useState('memories');
  const [currentTheme, setCurrentTheme] = useState(themes.light); // Default to light theme

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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.background }]}>
      <StatusBar
        barStyle={currentTheme.text === '#000000' ? 'dark-content' : 'light-content'}
        backgroundColor={currentTheme.background}
      />

      {/* Header with Back Button & Settings */}
      <View style={[styles.header, { borderBottomColor: currentTheme.secondary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Homepage')}
        >
          <ChevronLeft size={24} color={currentTheme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.primary }]}>Profile</Text>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: currentTheme.secondary }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Settings size={24} color={currentTheme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Cover Photo */}
        <View style={styles.coverPhotoContainer}>
          {user?.coverPhoto ? (
            <Image source={{ uri: user.coverPhoto }} style={styles.coverPhoto} />
          ) : (
            <View style={[styles.coverPhoto, { backgroundColor: currentTheme.secondary }]} />
          )}
          <TouchableOpacity style={[styles.editCoverPhotoButton, { backgroundColor: `rgba(${parseInt(currentTheme.primary.slice(1, 3), 16)}, ${parseInt(currentTheme.primary.slice(3, 5), 16)}, ${parseInt(currentTheme.primary.slice(5, 7), 16)}, 0.5)` }]}>
            <Edit3 size={18} color={currentTheme.background} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfoContainer}>
          <View style={styles.profileAvatarContainer}>
            <Image
              source={{ uri: user?.profilePic || 'https://via.placeholder.com/150' }}
              style={[styles.profileAvatar, { borderColor: currentTheme.accent }]}
            />
            <TouchableOpacity style={[styles.editAvatarButton, { backgroundColor: currentTheme.primary }]}>
              <Edit3 size={16} color={currentTheme.background} />
            </TouchableOpacity>
          </View>
          <View style={styles.profileDetails}>
            <Text style={[styles.profileName, { color: currentTheme.text }]}>{user?.name}</Text>
            <Text style={[styles.profileUsername, { color: currentTheme.text }]}>
              {user?.instagramUsername
                ? user.instagramUsername
                : '@' + (user?.username || '')}
            </Text>
            <Text style={[styles.profileBio, { color: currentTheme.text }]}>
              "{user?.bio || 'No bio added'}"
            </Text>
            <Text style={[styles.profileBio, { color: currentTheme.text }]}>
              <Text style={{ fontWeight: 'bold' }}>Relationship:</Text>{' '}
              {user?.relationshipStatus || 'Prefer Not To Tell'}
            </Text>
            <Text style={[styles.profileBio, { color: currentTheme.text }]}>
              <Text style={{ fontWeight: 'bold' }}>Class & Sec:</Text>{' '}
              {user?.class || 'Not '} {user?.section || 'Listed'}
            </Text>

            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <Text style={[styles.profileStatNumber, { color: currentTheme.text }]}>{memoryCount}</Text>
                <Text style={[styles.profileStatLabel, { color: currentTheme.text }]}>Memories</Text>
              </View>
              <View style={[styles.profileStatDivider, { backgroundColor: currentTheme.secondary }]} />
              <View style={styles.profileStat}>
                <Text style={[styles.profileStatNumber, { color: currentTheme.text }]}>{friends.length}</Text>
                <Text style={[styles.profileStatLabel, { color: currentTheme.text }]}>Friends</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.editProfileButton, { backgroundColor: currentTheme.secondary }]}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={[styles.editProfileButtonText, { color: currentTheme.text }]}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Friends Section */}
        <View style={[styles.friendsSection, { borderTopColor: currentTheme.secondary }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Friends</Text>
            <TouchableOpacity onPress={() => navigation.navigate('FriendsList')}>
              <Text style={[styles.sectionViewAll, { color: currentTheme.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={friends}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.friendItem}>
                <Image
                  source={{ uri: item.profilePic || 'https://via.placeholder.com/150' }}
                  style={[styles.friendAvatar, { borderColor: currentTheme.accent }]}
                />
                <Text style={[styles.friendName, { color: currentTheme.text }]}>{item.name}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item._id || item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.friendsList}
          />
        </View>

        {/* Tabs */}
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

          <TouchableOpacity
            style={[styles.tab, activeTab === 'tagged' && styles.activeTab]}
            onPress={() => setActiveTab('tagged')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'tagged' && { color: currentTheme.primary },
                { color: currentTheme.text },
              ]}
            >
              Tagged
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
            onPress={() => setActiveTab('saved')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'saved' && { color: currentTheme.primary },
                { color: currentTheme.text },
              ]}
            >
              Saved
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
            onPress={() => setActiveTab('calendar')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'calendar' && { color: currentTheme.primary },
                { color: currentTheme.text },
              ]}
            >
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
            key="memories-3"
            style={styles.memoryGridContainer}
          />
        ) : activeTab === 'tagged' ? (
          <FlatList
            data={taggedMemories}
            renderItem={renderMemoryGridItem}
            keyExtractor={(item) => item._id}
            numColumns={3}
            key="tagged-3"
            style={styles.memoryGridContainer}
          />
        ) : (
          <View style={styles.emptyTabContainer}>
            <Text style={[styles.emptyTabText, { color: currentTheme.text }]}>
              No content to display yet
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation Bar */}
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
          <PlusSquare size={24} color={currentTheme.background} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MemeFeedScreen')}>
          <Video size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Image
            source={{ uri: user?.profilePic || 'https://via.placeholder.com/24' }}
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
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  settingsButton: { padding: 4, borderRadius: 20 },
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
  editProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  editProfileButtonText: { fontWeight: '600', fontSize: 14 },
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
  friendName: { fontSize: 12, textAlign: 'center' },
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
  emptyTabContainer: { height: 200, justifyContent: 'center', alignItems: 'center' },
  emptyTabText: { fontSize: 16 },
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