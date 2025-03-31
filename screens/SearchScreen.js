import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from 'react-native';
import { Search, Lightbulb, UserPlus, ChevronDown, ChevronUp, Heart, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Swiper from 'react-native-deck-swiper';

const { width, height } = Dimensions.get('window');
const API_URL = 'https://radiantbackend.onrender.com';

// Define themes directly in the file (same as App.js)
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

export default function SearchScreen() {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const navigation = useNavigation();
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    school: '',
    class: '',
    section: '',
    interests: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const swiperRef = useRef(null);
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
    const fetchToken = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    if (token && (activeTab === 'recommendations' || activeTab === 'quickmatch')) {
      fetchRecommendations();
      fetchFriends();
    }
  }, [activeTab, token]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/recommendUsers`, {
        headers: { token },
      });
      const data = Array.isArray(response.data) ? response.data : [];
      const rejectedUserIds = await getRejectedUserIds();
      const filteredRecommendations = data.filter(
        (user) => !isFriend(user._id) && !rejectedUserIds.includes(user._id)
      );
      setRecommendations(filteredRecommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      Alert.alert('Error', 'Failed to fetch recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/getFriends`, {
        headers: { token },
      });
      setFriends(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const sendFriendRequest = async (friendId) => {
    try {
      await axios.post(
        `${API_URL}/sendFriendRequest`,
        { friendId },
        { headers: { token } }
      );
      Alert.alert('Success', 'Friend request sent!');
      fetchRecommendations();
      fetchFriends();
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to send friend request');
    }
  };

  const isFriend = (userId) => {
    return friends.some((friend) => friend._id === userId);
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/searchUsers`, {
        headers: { token },
        params: { query: searchQuery, ...searchFilters },
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getRejectedUserIds = async () => {
    try {
      const rejectedIds = await AsyncStorage.getItem('rejectedUserIds');
      return rejectedIds ? JSON.parse(rejectedIds) : [];
    } catch (error) {
      console.error('Error getting rejected user IDs:', error);
      return [];
    }
  };

  const saveRejectedUserId = async (userId) => {
    try {
      const rejectedIds = await getRejectedUserIds();
      if (!rejectedIds.includes(userId)) {
        rejectedIds.push(userId);
        await AsyncStorage.setItem('rejectedUserIds', JSON.stringify(rejectedIds));
      }
    } catch (error) {
      console.error('Error saving rejected user ID:', error);
    }
  };

  const renderCard = (card) => (
    <View style={[styles.card, { backgroundColor: currentTheme.background }]}>
      <Image source={{ uri: card.profilePic }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, { color: currentTheme.text }]}>{`${card.name}, 16`}</Text>
        <Text style={[styles.cardQuote, { color: currentTheme.text, borderLeftColor: currentTheme.primary }]}>
          "La Passion"
        </Text>
        <Text style={[styles.cardDetail, { color: currentTheme.text }]}>
          <Text style={[styles.detailLabel, { color: currentTheme.text }]}>Class & Section: </Text>
          {`${card.class} - ${card.section}`}
        </Text>
        <Text style={[styles.cardDetail, { color: currentTheme.text }]}>
          <Text style={[styles.detailLabel, { color: currentTheme.text }]}>Relationship Status: </Text>
          Single
        </Text>
        <Text style={[styles.cardDetail, { color: currentTheme.text }]}>
          <Text style={[styles.detailLabel, { color: currentTheme.text }]}>Interests: </Text>
          {card.interests.join(', ') || 'Not specified'}
        </Text>
      </View>
    </View>
  );

  const renderTabContent = () => {
    const quickMatchUsers = recommendations.filter((user) => !isFriend(user._id));

    switch (activeTab) {
      case 'search':
        return (
          <View>
            <TextInput
              style={[styles.searchInput, { backgroundColor: currentTheme.background, color: currentTheme.text }]}
              placeholder="Search users..."
              placeholderTextColor={currentTheme.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              style={[styles.filterToggle, { backgroundColor: currentTheme.background }]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Text style={[styles.filterToggleText, { color: currentTheme.text }]}>Filters</Text>
              {showFilters ? (
                <ChevronUp size={20} color={currentTheme.text} />
              ) : (
                <ChevronDown size={20} color={currentTheme.text} />
              )}
            </TouchableOpacity>
            {showFilters && (
              <View>
                <TextInput
                  style={[styles.searchInput, { backgroundColor: currentTheme.background, color: currentTheme.text }]}
                  placeholder="School"
                  placeholderTextColor={currentTheme.secondary}
                  value={searchFilters.school}
                  onChangeText={(text) => setSearchFilters({ ...searchFilters, school: text })}
                />
                <TextInput
                  style={[styles.searchInput, { backgroundColor: currentTheme.background, color: currentTheme.text }]}
                  placeholder="Class"
                  placeholderTextColor={currentTheme.secondary}
                  value={searchFilters.class}
                  onChangeText={(text) => setSearchFilters({ ...searchFilters, class: text })}
                />
                <TextInput
                  style={[styles.searchInput, { backgroundColor: currentTheme.background, color: currentTheme.text }]}
                  placeholder="Section"
                  placeholderTextColor={currentTheme.secondary}
                  value={searchFilters.section}
                  onChangeText={(text) => setSearchFilters({ ...searchFilters, section: text })}
                />
                <TextInput
                  style={[styles.searchInput, { backgroundColor: currentTheme.background, color: currentTheme.text }]}
                  placeholder="Interests (comma-separated)"
                  placeholderTextColor={currentTheme.secondary}
                  value={searchFilters.interests}
                  onChangeText={(text) => setSearchFilters({ ...searchFilters, interests: text })}
                />
              </View>
            )}
            <TouchableOpacity style={[styles.searchButton, { backgroundColor: currentTheme.primary }]} onPress={handleSearch}>
              <Text style={[styles.searchButtonText, { color: currentTheme.background }]}>Search</Text>
            </TouchableOpacity>
            {loading && activeTab === 'search' && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={currentTheme.primary} />
              </View>
            )}
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.recommendationItem, { backgroundColor: currentTheme.background }]}
                  onPress={() => navigation.navigate('OtherProfile', { userId: item._id })}
                >
                  <Image
                    source={{ uri: item.profilePic }}
                    style={[styles.profilePic, { borderColor: currentTheme.accent }]}
                  />
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: currentTheme.text }]}>{item.name}</Text>
                    <Text style={[styles.userClass, { color: currentTheme.text }]}>{item.class} - {item.section}</Text>
                    <Text style={[styles.userInterests, { color: currentTheme.text }]}>
                      {item.interests.join(', ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        );
      case 'recommendations':
        if (loading && activeTab === 'recommendations') {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={currentTheme.primary} />
            </View>
          );
        }
        return (
          <FlatList
            data={quickMatchUsers}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.recommendationItem, { backgroundColor: currentTheme.background }]}
                onPress={() => navigation.navigate('OtherProfile', { userId: item._id })}
              >
                <Image
                  source={{ uri: item.profilePic }}
                  style={[styles.profilePic, { borderColor: currentTheme.accent }]}
                />
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: currentTheme.text }]}>{item.name}</Text>
                  <Text style={[styles.userClass, { color: currentTheme.text }]}>{item.class} - {item.section}</Text>
                  <Text style={[styles.userInterests, { color: currentTheme.text }]}>
                    {item.interests.join(', ')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: currentTheme.primary }]}
                  onPress={() => sendFriendRequest(item._id)}
                >
                  <UserPlus size={24} color={currentTheme.background} />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        );
      case 'quickmatch':
        if (loading) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={currentTheme.primary} />
            </View>
          );
        }
        if (quickMatchUsers.length === 0) {
          return (
            <View style={[styles.emptyStateContainer, { backgroundColor: currentTheme.background }]}>
              <Text style={[styles.noUsersText, { color: currentTheme.text }]}>
                No users available for QuickMatch
              </Text>
            </View>
          );
        }
        return (
          <View style={[styles.quickMatchContainer, { backgroundColor: currentTheme.background }]}>
            <Swiper
              ref={swiperRef}
              cards={quickMatchUsers}
              renderCard={renderCard}
              onSwipedLeft={(index) => {
                saveRejectedUserId(quickMatchUsers[index]._id);
                console.log('Rejected:', quickMatchUsers[index]);
              }}
              onSwipedRight={(index) => sendFriendRequest(quickMatchUsers[index]._id)}
              onSwipedAll={() => Alert.alert('No more users', 'Check back later!')}
              cardIndex={0}
              backgroundColor={'transparent'}
              stackSize={3}
              horizontalSwipe={true}
              verticalSwipe={false}
              containerStyle={styles.swiperContainer}
              cardStyle={styles.swiperCardStyle}
              overlayLabels={{
                left: {
                  title: 'NOPE',
                  style: {
                    label: {
                      backgroundColor: 'rgba(255, 77, 77, 0.8)',
                      color: 'white',
                      fontSize: 24,
                      fontWeight: 'bold',
                      padding: 10,
                      borderRadius: 5,
                    },
                    wrapper: {
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'flex-start',
                      marginTop: 30,
                      marginLeft: -30,
                    },
                  },
                },
                right: {
                  title: 'LIKE',
                  style: {
                    label: {
                      backgroundColor: `rgba(${parseInt(currentTheme.primary.slice(1, 3), 16)}, ${parseInt(
                        currentTheme.primary.slice(3, 5),
                        16
                      )}, ${parseInt(currentTheme.primary.slice(5, 7), 16)}, 0.8)`,
                      color: 'white',
                      fontSize: 24,
                      fontWeight: 'bold',
                      padding: 10,
                      borderRadius: 5,
                    },
                    wrapper: {
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      marginTop: 30,
                      marginLeft: 30,
                    },
                  },
                },
              }}
              animateOverlayLabelsOpacity
              animateCardOpacity
              swipeAnimationDuration={300}
            />
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                onPress={() => {
                  if (swiperRef.current) {
                    swiperRef.current.swipeLeft();
                  }
                }}
                style={[styles.actionButton, styles.dislikeButton]}
              >
                <X size={30} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (swiperRef.current) {
                    swiperRef.current.swipeRight();
                  }
                }}
                style={[styles.actionButton, { backgroundColor: currentTheme.primary }]}
              >
                <Heart size={30} color={currentTheme.background} />
              </TouchableOpacity>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.tabBar, { backgroundColor: currentTheme.background, borderBottomColor: currentTheme.secondary }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'quickmatch' && styles.activeTabButton]}
          onPress={() => setActiveTab('quickmatch')}
        >
          <Heart size={24} color={activeTab === 'quickmatch' ? currentTheme.primary : currentTheme.text} />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'quickmatch' && { color: currentTheme.primary },
              { color: currentTheme.text },
            ]}
          >
            QuickMatch
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'search' && styles.activeTabButton]}
          onPress={() => setActiveTab('search')}
        >
          <Search size={24} color={activeTab === 'search' ? currentTheme.primary : currentTheme.text} />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'search' && { color: currentTheme.primary },
              { color: currentTheme.text },
            ]}
          >
            Search
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'recommendations' && styles.activeTabButton]}
          onPress={() => setActiveTab('recommendations')}
        >
          <Lightbulb size={24} color={activeTab === 'recommendations' ? currentTheme.primary : currentTheme.text} />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'recommendations' && { color: currentTheme.primary },
              { color: currentTheme.text },
            ]}
          >
            Picks
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>{renderTabContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingTop: 20,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  tabButton: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: 'rgba(82, 113, 255, 0.2)', // Adjusted to be theme-agnostic
  },
  tabButtonText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  searchInput: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    fontSize: 16,
  },
  searchButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  profilePic: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 15,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 4,
  },
  userClass: {
    fontSize: 14,
    marginBottom: 3,
  },
  userInterests: {
    fontSize: 13,
    lineHeight: 18,
  },
  addButton: {
    padding: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  quickMatchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noUsersText: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  swiperContainer: {
    flex: 1,
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    bottom: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swiperCardStyle: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  card: {
    marginLeft: 20,
    marginRight: 20,
    marginTop: 10,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  cardImage: {
    width: '100%',
    height: '60%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cardInfo: {
    padding: 25,
  },
  cardName: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardQuote: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 18,
    borderLeftWidth: 4,
    paddingLeft: 12,
    lineHeight: 22,
  },
  cardDetail: {
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 22,
  },
  detailLabel: {
    fontWeight: '700',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width * 0.55,
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  likeButton: {
    backgroundColor: '#5271FF', // Overwritten by theme
  },
  dislikeButton: {
    backgroundColor: '#ff4d4d',
  },
});