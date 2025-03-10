import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Calendar, Search, Lightbulb, UserPlus, ChevronDown, ChevronUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'https://radiantbackend.onrender.com';

export default function SearchScreen() {
    const [activeTab, setActiveTab] = useState('recommendations');
    const [recommendations, setRecommendations] = useState();
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState(null);
    const navigation = useNavigation();
    const [friends, setFriends] = useState();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchFilters, setSearchFilters] = useState({
        school: '',
        class: '',
        section: '',
        interests: '',
    });
    const [showFilters, setShowFilters] = useState(false);

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
        if (activeTab === 'recommendations' && token !== null) {
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
            if (Array.isArray(response.data)) {
                setRecommendations(response.data);
            } else {
                console.error('Invalid API response:', response.data);
                setRecommendations();
            }
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            Alert.alert('Error', 'Failed to fetch recommendations');
            setRecommendations();
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
            if (error.response && error.response.data && error.response.data.error) {
                Alert.alert('Error', error.response.data.error);
            } else {
                Alert.alert('Error', 'Failed to send friend request');
            }
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
                params: {
                    query: searchQuery,
                    ...searchFilters,
                },
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

    const renderTabContent = () => {
        switch (activeTab) {
            case 'events':
                return <Text style={styles.tabContent}>Events Content</Text>;
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
                            {showFilters ? <ChevronUp size={20} color="#fff" /> : <ChevronDown size={20} color="#fff" />}
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
                        data={
                            recommendations &&
                            recommendations.length > 0 &&
                            recommendations.filter(user => !isFriend(user._id))
                        }
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
                            </TouchableOpacity>)}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'events' && styles.activeTabButton]}
                    onPress={() => setActiveTab('events')}
                >
                    <Calendar size={24} color="black" />
                    <Text style={styles.tabButtonText}>Events</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'search' && styles.activeTabButton]}
                    onPress={() => setActiveTab('search')}
                >
                    <Search size={24} color="black" />
                    <Text style={styles.tabButtonText}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'recommendations' && styles.activeTabButton]}
                    onPress={() => setActiveTab('recommendations')}
                >
                    <Lightbulb size={24} color="black" />
                    <Text style={styles.tabButtonText}>Picks</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.contentContainer}>{renderTabContent()}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', // Changed background to white
        paddingTop: 20, // Adjusted padding
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10, // Adjusted padding
        borderBottomWidth: 1,
        borderBottomColor: '#eee', // Lightened border color
        marginHorizontal: 0, // Removed horizontal margin
        backgroundColor: '#f9f9f9' // added a light background color.
    },
    tabButton: {
        alignItems: 'center',
        marginHorizontal: 5, // Reduced margin
        padding: 8, // Added padding to the tab buttons.
    },
    activeTabButton: {
        borderBottomWidth: 2,
        borderBottomColor: '#5271FF', // Changed active tab color
        paddingBottom: 5, // Adjusted padding
    },
    tabButtonText: {
        color: '#333', // Changed text color to dark gray
        marginTop: 3, // Adjusted margin
        fontSize: 14, // Adjusted font size
    },
    contentContainer: {
        flex: 1,
        padding: 15, // Adjusted padding
    },
    tabContent: {
        color: '#333', // Changed text color
        fontSize: 16,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recommendationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12, // Adjusted padding
        borderBottomWidth: 1,
        borderBottomColor: '#eee', // Lightened border color
        backgroundColor: '#fff', // White background for items
        borderRadius: 8, // Rounded corners for items
        marginBottom: 8, // Added margin between items
        paddingHorizontal: 12, // Added horizontal padding
    },
    profilePic: {
        width: 45, // Adjusted profile pic size
        height: 45,
        borderRadius: 22.5,
        marginRight: 12,
        borderWidth: 1, // Added border
        borderColor: '#ddd', // Light border color
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: '#333', // Changed text color
        fontSize: 16,
        fontWeight: '600', // Added font weight
    },
    userClass: {
        color: '#777', // Changed text color
        fontSize: 13,
        marginTop: 2,
    },
    userInterests: {
        color: '#777', // Changed text color
        fontSize: 13,
        marginTop: 2,
    },
    addButton: {
        padding: 8,
        backgroundColor: '#5271FF', // Changed button color
        borderRadius: 20, // Rounded button
    },
    searchInput: {
        backgroundColor: '#f0f0f0', // Light background for input
        color: '#333',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1, // Added border
        borderColor: '#ddd', // Light border color
    },
    searchButton: {
        backgroundColor: '#5271FF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600', // Added font weight
    },
    filterToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1, // Added border
        borderColor: '#ddd', // Light border color
    },
    filterToggleText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600', // Added font weight
    },
});