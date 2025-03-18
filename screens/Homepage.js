import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, SafeAreaView, StatusBar, Modal, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import io from 'socket.io-client';

import { Dimensions } from 'react-native';
import {
    Bell,
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

    useEffect(() => {
        const loadUser = async () => {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
              nav.replace('Login');
              return;
            }
            try {
              const res = await axios.get(`${API_URL}/profile`, { headers: { token } });
              
              // Validate user and _id
              if (!res.data || !res.data._id || res.data._id === 'null') {
                console.error('Invalid user data:', res.data);
                Alert.alert('Error', 'Failed to load valid user data.');
                return;
              }
              
              setUser(res.data);
              fetchFriendRequests(token);
              fetchProfileMemories(token);
              
              // Only initialize socket if user._id is valid
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

    const fetchProfileMemories = async (token) => {
        try {
            const profileResponse = await axios.get(`${API_URL}/profile`, { headers: { token } });
            const { createdMemories, taggedMemories } = profileResponse.data;
    
            const friendsMemoriesResponse = await axios.get(`${API_URL}/friendsMemories`, { headers: { token } });
            const friendsMemories = friendsMemoriesResponse.data;
    
            const allMemories = [...createdMemories, ...taggedMemories, ...friendsMemories];
            const seenMemoryIds = new Set();
            const uniqueMemories = allMemories.filter(memory => {
                if (seenMemoryIds.has(memory._id)) {
                    return false;
                }
                seenMemoryIds.add(memory._id);
                return true;
            }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6c5ce7" />
            </View>
        );
    }

    const hasNotifications = friendRequests.length > 0;

    const renderOnlineFriend = ({ item }) => (
        <TouchableOpacity style={styles.friendItem}>
            <View style={styles.friendAvatarContainer}>
                <Image source={{ uri: item.profilePic }} style={styles.friendAvatar} />
                {item.online && <View style={styles.onlineIndicator} />}
            </View>
            <Text style={styles.friendName}>{item.name}</Text>
        </TouchableOpacity>
    );

    const renderMemoryItem = ({ item }) => {
        return (
            <View style={styles.memoryItem}>
               <View style={styles.memoryHeader}>
                <View style={styles.memoryUser}>
                    <Image source={{ uri: item.author.profilePic }} style={styles.memoryUserAvatar} />
                    <View>
                        <Text style={styles.memoryUserName}>{item.author.name}</Text>
                        <View style={styles.memoryInfo}>
                            <Text style={styles.memoryTitle}>{item.title}</Text>
                            <Text style={styles.memoryDot}>•</Text>
                            <Text style={styles.memoryContributors}>
                                with {item.taggedFriends.slice(0, 2).map(friend => friend.name).join(', ')}
                                {item.taggedFriends.length > 2 ? ` +${item.taggedFriends.length - 2} more` : ''}
                            </Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity>
                    <MoreVertical size={20} color="#555" />
                </TouchableOpacity>
            </View>

            {item.photos && item.photos.length > 0 && (
                <View>
                    <FlatList
                        ref={flatListRef}
                        data={item.photos}
                        renderItem={({ item: photo }) => (
                            <Image source={{ uri: photo }} style={[styles.memoryImage, { width: Dimensions.get('window').width }]} />
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
                                    index === currentImageIndex && styles.activeImageIndicatorDot,
                                ]}
                            />
                        ))}
                    </View>
                </View>
            )}

            {/* ... (Memory Actions and Stats) */}
            <View style={styles.memoryActions}>
                <View style={styles.memoryActionsLeft}>
                    <TouchableOpacity style={styles.memoryAction}>
                        <Heart size={24} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.memoryAction}>
                        <MessageSquare size={24} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.memoryAction}>
                        <Share2 size={24} color="#333" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity>
                    <Bookmark size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <View style={styles.memoryStats}>
                <Text style={styles.memoryLikes}>0 likes</Text>
                <TouchableOpacity>
                    <Text style={styles.memoryViewComments}>View all 0 comments</Text>
                </TouchableOpacity>
                <Text style={styles.memoryTimestamp}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
        </View>
    );
    };
    

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Radiant</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.headerIcon} onPress={() => setShowNotifications(true)}>
                        <Bell size={24} color="#333" />
                        {hasNotifications && <View style={styles.notificationBadge} />}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerIcon}>
                        <MessageCircle size={24} color="#333" onPress={() => nav.navigate('Mainmessage', { userName: user?.name })} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content}>
            <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Online Friends</Text>
                    <FlatList
                        data={onlineFriends}
                        renderItem={renderOnlineFriend}
                        keyExtractor={item => item._id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.friendsList}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Memories</Text>
                    <FlatList
                        data={memories}
                        renderItem={renderMemoryItem}
                        keyExtractor={item => item._id}
                        scrollEnabled={false}
                        style={styles.memoriesList}
                    />
                </View>
            </ScrollView>

            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <Home size={24} color="#5271FF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => nav.navigate('SearchScreen')}>
                    <Search size={24} color="#777" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navItem, styles.createButton]} onPress={() => nav.navigate('MakeMemoryScreen')}>
                    <PlusSquare size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => nav.navigate('MemeFeedScreen')}>
                    <Video size={24} color="#777" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => nav.navigate('Profile')}>
                    <Image source={{ uri: user?.profilePic || 'https://via.placeholder.com/24' }} style={styles.navProfilePic} />
                </TouchableOpacity>
            </View>

            <Modal visible={showNotifications} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowNotifications(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Notifications</Text>
                        <FlatList
                            data={friendRequests}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => (
                                <View style={styles.notificationItem}>
                                    <Image source={{ uri: item.profilePic }} style={styles.notificationProfilePic} />
                                    <View style={styles.notificationUserInfo}>
                                        <Text style={styles.notificationUserName}>{item.name}</Text>
                                    </View>
                                    <View style={styles.notificationButtons}>
                                        <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptRequest(item._id)}>
                                            <UserPlus size={18} color="#fff" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.rejectButton} onPress={() => handleRejectRequest(item._id)}>
                                            <UserMinus size={18} color="#fff" />
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
        backgroundColor: '#1a0d2b',
    },
    navProfilePic: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#6c5ce7',
    },
    notificationBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: '#ff6b6b',
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
        backgroundColor: '#2d1b4e',
        padding: 20,
        borderRadius: 15,
        width: '85%',
    },
    closeButton: {
        alignSelf: 'flex-end',
        marginBottom: 15,
    },
    closeButtonText: {
        color: '#a29bfe',
        fontSize: 16,
        fontWeight: '600',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: '#1a0d2b',
        padding: 10,
        borderRadius: 10,
    },
    notificationProfilePic: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 2,
        borderColor: '#6c5ce7',
    },
    notificationUserInfo: {
        flex: 1,
    },
    notificationUserName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    notificationButtons: {
        flexDirection: 'row',
    },
    acceptButton: {
        backgroundColor: '#6c5ce7',
        padding: 8,
        borderRadius: 15,
        marginRight: 8,
    },
    rejectButton: {
        backgroundColor: '#4a3a6b',
        padding: 8,
        borderRadius: 15,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#5271FF',
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
        color: '#333',
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
        borderColor: '#5271FF',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4CAF50',
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
color: '#333',
},
memoryInfo: {
flexDirection: 'row',
alignItems: 'center',
flexWrap: 'wrap',
},
memoryTitle: {
fontSize: 13,
color: '#555',
fontWeight: '500',
},
memoryDot: {
marginHorizontal: 4,
color: '#999',
},
memoryContributors: {
fontSize: 13,
color: '#777',
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
color: '#777',
marginBottom: 4,
fontSize: 14,
},
memoryTimestamp: {
fontSize: 12,
color: '#999',
marginTop: 2,
},
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
navItem: {
alignItems: 'center',
justifyContent: 'center',
},
createButton: {
backgroundColor: '#5271FF',
width: 48,
height: 48,
borderRadius: 24,
justifyContent: 'center',
alignItems: 'center',
},
messagesList: {
paddingHorizontal: 16,
},
messageItem: {
flexDirection: 'row',
alignItems: 'center',
paddingVertical: 12,
borderBottomWidth: 1,
borderBottomColor: '#eee',
},
messageAvatar: {
width: 50,
height: 50,
borderRadius: 25,
},
messageContent: {
flex: 1,
marginLeft: 12,
},
messageHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 4,
},
messageSender: {
fontWeight: 'bold',
fontSize: 15,
color: '#333',
},
messageTime: {
fontSize: 12,
color: '#999',
},
messageText: {
fontSize: 14,
color: '#555',
},
unreadIndicator: {
width: 10,
height: 10,
borderRadius: 5,
backgroundColor: '#5271FF',
marginLeft: 8,
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
    backgroundColor: '#ccc',
    marginHorizontal: 4,
},
activeImageIndicatorDot: {
    backgroundColor: '#5271FF',
},
});   

export default App;