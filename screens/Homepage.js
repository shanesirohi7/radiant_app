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
    ActivityIndicator
} from 'react-native';
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
                fetchOnlineFriends(token); // Moved up to ensure order
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
    // New render function for long block conversation items
    const renderRecentConversationItem = ({ item }) => {
        const otherParticipant = item.participants.find((p) => p._id !== currentUserId) || item.participants[0];
        const name = otherParticipant?.name || 'Unknown';
        const profilePic = otherParticipant?.profilePic || 'https://via.placeholder.com/150';
        const lastMsg = item.lastMessage ? item.lastMessage.content : 'No messages yet';
        const lastMsgTime = item.lastMessage ? new Date(item.lastMessage.createdAt) : new Date(item.updatedAt);
        const formattedTime = lastMsgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Count unseen messages – make sure each conversation has a messages array
        // Only count messages sent by others and not read by you
        // For each conversation block:
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
                    {otherParticipant?.online && <View style={styles.blockOnlineIndicator} />}
                    {unreadMessages > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{unreadMessages}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.blockInfo}>
                    <View style={styles.blockHeader}>
                        <Text style={styles.blockName} numberOfLines={1}>{name}</Text>
                        <Text style={styles.blockTime}>{formattedTime}</Text>
                    </View>
                    <Text style={styles.blockLastMsg} numberOfLines={1}>{lastMsg}</Text>
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
                .slice(0, 5); // Limit to top 5
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
            (!item.lastMessage.readBy ||
                !item.lastMessage.readBy.includes(currentUserId))
    ).length;



    const fetchProfileMemories = async (token) => {
        try {
            const profileResponse = await axios.get(`${API_URL}/profile`, { headers: { token } });
            const { createdMemories, taggedMemories } = profileResponse.data;
            const friendsMemoriesResponse = await axios.get(`${API_URL}/friendsMemories`, { headers: { token } });
            const friendsMemories = friendsMemoriesResponse.data;
            const allMemories = [...createdMemories, ...taggedMemories, ...friendsMemories];
            const seenMemoryIds = new Set();
            const uniqueMemories = allMemories.filter(memory => {
                if (seenMemoryIds.has(memory._id)) return false;
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

    const renderConversationItem = ({ item }) => {
        const otherParticipant =
            item.participants.find((p) => p._id !== currentUserId) || item.participants[0];
        const name = otherParticipant?.name || 'Unknown';
        const profilePic =
            otherParticipant?.profilePic || 'https://via.placeholder.com/150';
        const lastMsgTime = item.lastMessage
            ? new Date(item.lastMessage.createdAt)
            : new Date(item.updatedAt);
        const formattedTime = lastMsgTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
        // Show the message text only if it was sent by you
        const messageText =
            item.lastMessage && item.lastMessage.sender === currentUserId
                ? item.lastMessage.content
                : '';

        return (
            <TouchableOpacity
                style={styles.convoBlock}
                onPress={() =>
                    nav.navigate('Chat', {
                        conversationId: item._id,
                        participants: item.participants,
                        name,
                    })
                }
            >
                <Image source={{ uri: profilePic }} style={styles.convoAvatar} />
                <Text style={styles.convoName} numberOfLines={1}>
                    {name}
                </Text>
                {messageText ? (
                    <Text style={styles.convoMsg} numberOfLines={1}>
                        {messageText}
                    </Text>
                ) : null}
                <Text style={styles.convoTime}>{formattedTime}</Text>
            </TouchableOpacity>
        );
    };


    const renderMemoryItem = ({ item }) => (
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Radiant</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={styles.headerIcon} onPress={() => setShowNotifications(true)}>
                        <Bell size={30} color="#333" />
                        {hasNotifications && <View style={styles.notificationBadge} />}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerIcon} onPress={() => nav.navigate('Mainmessage')}>
                        <MessageCircle size={30} color="#333" />
                        {unseenConvosCount > 0 && (
                            <View style={styles.headerBadge}>
                                <Text style={styles.headerBadgeText}>{unseenConvosCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                </View>
            </View>

            <ScrollView style={styles.content}>
                {/* New Recent Messages Section */}
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
                    <Text style={styles.sectionTitle}>Recent Messages</Text>
                    <FlatList
                        data={conversations}
                        renderItem={renderRecentConversationItem}
                        keyExtractor={(item) => item._id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.horizontalList}
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
        borderRadius: 20,
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
    recentConversationBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
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
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        padding: 10,
        marginRight: 10,
        width: 180, // Adjust width as needed
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
        color: '#555',
        marginBottom: 5,
    },
    convoTime: {
        fontSize: 12,
        color: '#777',
    },
    headerBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF3B30',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerBadgeText: {
        color: '#fff',
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
        borderColor: '#5271FF',
    },
    blockOnlineIndicator: {
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
        color: '#333',
        flex: 1,
    },
    blockTime: {
        fontSize: 13,
        color: '#777',
    },
    blockLastMsg: {
        fontSize: 14,
        color: '#555',
    },
    unreadBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: '#FF3B30',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    unreadBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    recentConversationBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
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
        borderColor: '#5271FF',
    },
    blockOnlineIndicator: {
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
        color: '#333',
        flex: 1,
    },
    blockTime: {
        fontSize: 13,
        color: '#777',
    },
    blockLastMsg: {
        fontSize: 14,
        color: '#555',
    },
    unreadBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: '#FF3B30',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    unreadBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
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
    conversationsList: {
        paddingLeft: 16,
    },
    conversationItem: {
        alignItems: 'center',
        marginRight: 16,
        width: 120,
    },
    conversationAvatarContainer: {
        position: 'relative',
    },
    conversationAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: '#5271FF',
    },
    conversationOnlineIndicator: {
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
    conversationInfo: {
        marginTop: 4,
        alignItems: 'center',
    },
    conversationName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    conversationLastMessage: {
        fontSize: 10,
        color: '#777',
        textAlign: 'center',
    },
    noConversationsText: {
        fontSize: 14,
        color: '#777',
        paddingHorizontal: 16,
    },
    messagesList: {
        paddingLeft: 16,
    },
    messageBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        padding: 10,
        marginRight: 12,
        maxWidth: 200,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    messageAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 8,
    },
    messageContent: {
        flex: 1,
    },
    messageName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    messageText: {
        fontSize: 12,
        color: '#666',
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