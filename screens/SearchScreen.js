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
            const filteredRecommendations = data.filter(user => !isFriend(user._id) && !rejectedUserIds.includes(user._id));
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
        <View style={styles.card}>
            <Image
                source={{ uri: card.profilePic }}
                style={styles.cardImage}
                resizeMode="cover"
            />
            <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{`${card.name}, 16`}</Text>
                <Text style={styles.cardQuote}>"La Passion"</Text>
                <Text style={styles.cardDetail}>
                    <Text style={styles.detailLabel}>Class & Section: </Text>
                    {`${card.class} - ${card.section}`}
                </Text>
                <Text style={styles.cardDetail}>
                    <Text style={styles.detailLabel}>Relationship Status: </Text>
                    Single
                </Text>
                <Text style={styles.cardDetail}>
                    <Text style={styles.detailLabel}>Interests: </Text>
                    {card.interests.join(', ') || 'Not specified'}
                </Text>
            </View>
        </View>
    );

    const renderTabContent = () => {
        const quickMatchUsers = recommendations.filter(user => !isFriend(user._id));

        switch (activeTab) {
            case 'search':
                return (
                    <View>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search users..."
                            placeholderTextColor="#aaa"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                        />
                        <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(!showFilters)}>
                            <Text style={styles.filterToggleText}>Filters</Text>
                            {showFilters ? <ChevronUp size={20} color="#000" /> : <ChevronDown size={20} color="#000" />}
                        </TouchableOpacity>
                        {showFilters && (
                            <View>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="School"
                                    placeholderTextColor="#aaa"
                                    value={searchFilters.school}
                                    onChangeText={(text) => setSearchFilters({ ...searchFilters, school: text })}
                                />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Class"
                                    placeholderTextColor="#aaa"
                                    value={searchFilters.class}
                                    onChangeText={(text) => setSearchFilters({ ...searchFilters, class: text })}
                                />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Section"
                                    placeholderTextColor="#aaa"
                                    value={searchFilters.section}
                                    onChangeText={(text) => setSearchFilters({ ...searchFilters, section: text })}
                                />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Interests (comma-separated)"
                                    placeholderTextColor="#aaa"
                                    value={searchFilters.interests}
                                    onChangeText={(text) => setSearchFilters({ ...searchFilters, interests: text })}
                                />
                            </View>
                        )}
                        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                            <Text style={styles.searchButtonText}>Search</Text>
                        </TouchableOpacity>
                        {loading && activeTab === 'search' && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#6c5ce7" />
                            </View>
                        )}
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.recommendationItem}
                                    onPress={() => navigation.navigate('OtherProfile', { userId: item._id })}
                                >
                                    <Image source={{ uri: item.profilePic }} style={styles.profilePic} />
                                    <View style={styles.userInfo}>
                                        <Text style={styles.userName}>{item.name}</Text>
                                        <Text style={styles.userClass}>{item.class} - {item.section}</Text>
                                        <Text style={styles.userInterests}>{item.interests.join(', ')}</Text>
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
                            <ActivityIndicator size="large" color="#6c5ce7" />
                        </View>
                    );
                }
                return (
                    <FlatList
                        data={quickMatchUsers}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.recommendationItem}
                                onPress={() => navigation.navigate('OtherProfile', { userId: item._id })}
                            >
                                <Image source={{ uri: item.profilePic }} style={styles.profilePic} />
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName}>{item.name}</Text>
                                    <Text style={styles.userClass}>{item.class} - {item.section}</Text>
                                    <Text style={styles.userInterests}>{item.interests.join(', ')}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => sendFriendRequest(item._id)}
                                >
                                    <UserPlus size={24} color="#fff" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        )}
                    />
                );
            case 'quickmatch':
                if (loading) {
                    return (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#6c5ce7" />
                        </View>
                    );
                }
                if (quickMatchUsers.length === 0) {
                    return (
                        <View style={styles.emptyStateContainer}>
                            <Text style={styles.noUsersText}>No users available for QuickMatch</Text>
                        </View>
                    );
                }
                return (
                    <View style={styles.quickMatchContainer}>
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
                                            backgroundColor: 'rgba(82, 113, 255, 0.8)',
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
                                style={[styles.actionButton, styles.likeButton]}
                            >
                                <Heart size={30} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'quickmatch' && styles.activeTabButton]}
                    onPress={() => setActiveTab('quickmatch')}
                >
                    <Heart size={24} color={activeTab === 'quickmatch' ? "#5271FF" : "black"} />
                    <Text style={[styles.tabButtonText, activeTab === 'quickmatch' && styles.activeTabText]}>QuickMatch</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'search' && styles.activeTabButton]}
                    onPress={() => setActiveTab('search')}
                >
                    <Search size={24} color={activeTab === 'search' ? "#5271FF" : "black"} />
                    <Text style={[styles.tabButtonText, activeTab === 'search' && styles.activeTabText]}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'recommendations' && styles.activeTabButton]}
                    onPress={() => setActiveTab('recommendations')}
                >
                    <Lightbulb size={24} color={activeTab === 'recommendations' ? "#5271FF" : "black"} />
                    <Text style={[styles.tabButtonText, activeTab === 'recommendations' && styles.activeTabText]}>Picks</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.contentContainer}>{renderTabContent()}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    tabButton: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    activeTabButton: {
        borderBottomWidth: 3,
        borderBottomColor: '#5271FF',
    },
    tabButtonText: {
        color: '#333',
        marginTop: 4,
        fontSize: 12,
        fontWeight: '500',
    },
    activeTabText: {
        color: '#5271FF',
        fontWeight: '600',
    },
    contentContainer: {
        flex: 1,
    },
    // Search tab styles
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    searchInput: {
        backgroundColor: '#fff',
        color: '#333',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
    },
    searchButton: {
        backgroundColor: '#5271FF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    filterToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    filterToggleText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '500',
    },
    // Recommendations tab styles
    recommendationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    profilePic: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#f0f0f0',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: '#333',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 3,
    },
    userClass: {
        color: '#666',
        fontSize: 14,
        marginBottom: 2,
    },
    userInterests: {
        color: '#666',
        fontSize: 14,
    },
    addButton: {
        padding: 10,
        backgroundColor: '#5271FF',
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    // QuickMatch tab styles
    quickMatchContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noUsersText: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
    },
    swiperContainer: {
        flex: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 90,
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
        marginLeft: 30,
        marginTop: 10,
        borderRadius: 20,
        backgroundColor: '#fff',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    cardImage: {
        width: '100%',
        height: '60%',
    },
    cardInfo: {
        padding: 20,
    },
    cardName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    cardQuote: {
        fontSize: 16,
        fontStyle: 'italic',
        color: '#555',
        marginBottom: 15,
        borderLeftWidth: 3,
        borderLeftColor: '#5271FF',
        paddingLeft: 10,
    },
    cardDetail: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
    },
    detailLabel: {
        fontWeight: '600',
        color: '#333',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: width * 0.5,
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
    },
    actionButton: {
        width: 65,
        height: 65,
        borderRadius: 32.5,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    likeButton: {
        backgroundColor: '#5271FF',
    },
    dislikeButton: {
        backgroundColor: '#ff4d4d',
    },
});