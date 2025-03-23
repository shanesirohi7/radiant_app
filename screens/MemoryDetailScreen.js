import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    FlatList,
    StatusBar,
    Animated,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
} from 'react-native';
import { 
    PlusCircle, 
    Home, 
    Search, 
    PlusSquare, 
    Video, 
    ArrowLeft, 
    Heart, 
    MessageSquare, 
    Share2,
    Bookmark,
    MoreVertical,
    Users,
    Calendar,
    Clock
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

const API_URL = 'https://radiantbackend.onrender.com';

const MemoryDetailScreen = ({ route }) => {
    const navigation = useNavigation();
    const memory = route.params?.memory;
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [memoryDetail, setMemoryDetail] = useState(null);
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [newEventText, setNewEventText] = useState('');
    const [isCommentsModalVisible, setCommentsModalVisible] = useState(false);
    const [isYearPickerVisible, setYearPickerVisible] = useState(false);
    const [isMonthPickerVisible, setMonthPickerVisible] = useState(false);
    const [isDayPickerVisible, setDayPickerVisible] = useState(false);
    const [isTimePickerVisible, setTimePickerVisible] = useState(false);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);
    const [selectedHour, setSelectedHour] = useState(null);
    const [selectedMinute, setSelectedMinute] = useState(null);
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    navigation.replace('Login');
                    return;
                }
                const userRes = await axios.get(`${API_URL}/profile`, { headers: { token } });
                setCurrentUser(userRes.data);

                const memoryRes = await axios.get(`${API_URL}/memory/${memory._id}`, { headers: { token } });
                setMemoryDetail(memoryRes.data);

                setIsLiked(memoryRes.data.likes.some(like => like._id === userRes.data._id));
                setLikeCount(memoryRes.data.likes.length);
                setCommentCount(memoryRes.data.comments.length);
            } catch (error) {
                console.error('Error loading data:', error);
                Alert.alert('Error', 'Failed to load memory details');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [memory, navigation]);

    const handleLike = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(
                `${API_URL}/memory/${memory._id}/like`,
                {},
                { headers: { token } }
            );
            setIsLiked(!isLiked);
            setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
        } catch (error) {
            console.error('Error liking memory:', error);
            Alert.alert('Error', 'Failed to update like');
        }
    };

    const handleSave = () => {
        setIsSaved(!isSaved);
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/memory/${memory._id}/comment`,
                { content: newComment },
                { headers: { token } }
            );
            setMemoryDetail(prev => ({
                ...prev,
                comments: response.data.comments
            }));
            setCommentCount(prev => prev + 1);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
            Alert.alert('Error', 'Failed to add comment');
        }
    };

    const validateAndAddTimelineEvent = async () => {
        if (!newEventText.trim() || !selectedYear || !selectedMonth || !selectedDay || selectedHour === null || selectedMinute === null) {
            Alert.alert('Error', 'Please complete all fields');
            return;
        }

        const newEventDateTime = new Date(selectedYear, selectedMonth - 1, selectedDay, selectedHour, selectedMinute);
        const dateStr = newEventDateTime.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`; // HH:MM

        const latestEvent = memoryDetail.timelineEvents
            .map(event => new Date(`${event.date}T${event.time}:00`))
            .sort((a, b) => b - a)[0];
        
        if (latestEvent && newEventDateTime <= latestEvent) {
            Alert.alert('Error', 'New event must be after the latest timeline event');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/memory/${memory._id}/addTimelineEvent`,
                { 
                    date: dateStr, 
                    time: timeStr, 
                    eventText: newEventText 
                },
                { headers: { token } }
            );
            setMemoryDetail(response.data.memory);
            setNewEventText('');
            setSelectedYear(null);
            setSelectedMonth(null);
            setSelectedDay(null);
            setSelectedHour(null);
            setSelectedMinute(null);
        } catch (error) {
            console.error('Error adding timeline event:', error);
            Alert.alert('Error', 'Failed to add timeline event');
        }
    };

    const pickImageAndUpload = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'We need permission to access your photos.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled) {
                uploadImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error Selecting Image', error.message);
        }
    };

    const uploadImage = async (uri) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', { uri, type: 'image/jpeg', name: 'memory.jpg' });
            formData.append('upload_preset', 'radiant_preset');

            const response = await axios.post(
                'https://api.cloudinary.com/v1_1/dzljsey6i/image/upload',
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            await addPhotoToMemory(response.data.secure_url);
        } catch (error) {
            console.error('Upload Error:', error);
            Alert.alert('Upload Failed', 'Could not upload photo.');
        } finally {
            setLoading(false);
        }
    };

    const addPhotoToMemory = async (photoUrl) => {
        const token = await AsyncStorage.getItem('token');
        try {
            await axios.post(
                `${API_URL}/memory/${memoryDetail._id}/addPhoto`,
                { photoUrl },
                { headers: { token } }
            );
            const refreshedMemory = await axios.get(`${API_URL}/memory/${memoryDetail._id}`, { headers: { token } });
            setMemoryDetail(refreshedMemory.data);
        } catch (error) {
            console.error('Add Photo Error:', error);
            Alert.alert('Error', 'Could not add photo to memory.');
        }
    };

    const isAuthorized = currentUser && memoryDetail && (
        currentUser._id === memoryDetail.author?._id ||
        memoryDetail.taggedFriends?.some(friend => friend._id === currentUser._id)
    );

    const renderMemberItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.memberItem}
            onPress={() => navigation.navigate('OtherProfileScreen', { userId: item._id })}
        >
            <Image 
                source={{ uri: item.profilePic || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70) }} 
                style={styles.memberAvatar} 
            />
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberRole}>
                    {currentUser && item._id === memoryDetail?.author?._id ? 'Creator' : 'Member'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderTimelineItem = ({ item, index }) => (
        <View style={styles.timelineItem}>
            <View style={styles.timelineDotContainer}>
                <View style={styles.timelineDot} />
                {index < memoryDetail.timelineEvents.length - 1 && (
                    <View style={styles.timelineLine} />
                )}
            </View>
            <View style={styles.timelineContent}>
                <Text style={styles.timelineTime}>
                    {new Date(item.date).toLocaleDateString()} {item.time}
                </Text>
                <Text style={styles.timelineDescription}>{item.eventText}</Text>
            </View>
        </View>
    );

    const renderCommentItem = ({ item }) => (
        <View style={styles.commentItem}>
            <Image 
                source={{ uri: item.author.profilePic || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70) }} 
                style={styles.commentAvatar} 
            />
            <View style={styles.commentContent}>
                <Text style={styles.commentAuthor}>{item.author.name}</Text>
                <Text style={styles.commentText}>{item.content}</Text>
                <Text style={styles.commentTime}>
                    {new Date(item.createdAt).toLocaleTimeString()}
                </Text>
            </View>
        </View>
    );

    const renderPostItem = ({ item }) => (
        <TouchableOpacity style={styles.postItem}>
            <Image source={{ uri: item }} style={styles.postImage} />
        </TouchableOpacity>
    );

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Picker data
    const years = Array.from({ length: 20 }, (_, i) => 2023 + i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const renderPickerItem = (value, onSelect, isSelected) => (
        <TouchableOpacity
            style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
            onPress={() => onSelect(value)}
        >
            <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                {String(value).padStart(2, '0')}
            </Text>
        </TouchableOpacity>
    );

    const handleYearSelect = (year) => {
        setSelectedYear(year);
        setYearPickerVisible(false);
        setMonthPickerVisible(true);
    };

    const handleMonthSelect = (month) => {
        setSelectedMonth(month);
        setMonthPickerVisible(false);
        setDayPickerVisible(true);
    };

    const handleDaySelect = (day) => {
        setSelectedDay(day);
        setDayPickerVisible(false);
        setTimePickerVisible(true);
    };

    const handleTimeSelect = (hour, minute) => {
        setSelectedHour(hour);
        setSelectedMinute(minute);
        setTimePickerVisible(false);
    };

    if (loading && !memoryDetail) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5271FF" />
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!memoryDetail) return null;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{memoryDetail.title}</Text>
                <TouchableOpacity>
                    <MoreVertical size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.memoryBanner}>
                    <Image 
                        source={{ uri: memoryDetail.photos?.[0] || 'https://via.placeholder.com/400x200' }} 
                        style={styles.bannerImage} 
                    />
                    <View style={styles.bannerOverlay}>
                        <View style={styles.memoryCreator}>
                            <Image 
                                source={{ uri: memoryDetail.author?.profilePic || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70) }} 
                                style={styles.creatorAvatar} 
                            />
                            <Text style={styles.creatorName}>Created by {memoryDetail.author?.name}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.memoryInfo}>
                    <View style={styles.memoryInfoItem}>
                        <Calendar size={16} color="#5271FF" />
                        <Text style={styles.memoryInfoText}>{formatDate(memoryDetail.createdAt)}</Text>
                    </View>
                    <View style={styles.memoryInfoItem}>
                        <Users size={16} color="#5271FF" />
                        <Text style={styles.memoryInfoText}>
                            {(memoryDetail.taggedFriends?.length || 0) + 1} members
                        </Text>
                    </View>
                    <View style={styles.memoryInfoItem}>
                        <Image size={16} color="#5271FF" />
                        <Text style={styles.memoryInfoText}>
                            {memoryDetail.photos?.length || 0} posts
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Members</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={[memoryDetail.author, ...(memoryDetail.taggedFriends || [])]}
                        renderItem={renderMemberItem}
                        keyExtractor={(item, index) => item?._id || index.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.membersList}
                    />
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Timeline Events</Text>
                    </View>
                    <FlatList
                        data={memoryDetail.timelineEvents}
                        renderItem={renderTimelineItem}
                        keyExtractor={(item, index) => index.toString()}
                        scrollEnabled={false}
                        style={styles.timelineList}
                    />
                    {isAuthorized && (
                        <View style={styles.addTimelineContainer}>
                            <TouchableOpacity
                                style={styles.timelinePickerButton}
                                onPress={() => setYearPickerVisible(true)}
                            >
                                <Text style={styles.timelinePickerText}>
                                    {selectedYear 
                                        ? `${selectedYear}-${selectedMonth ? String(selectedMonth).padStart(2, '0') : 'MM'}-${selectedDay ? String(selectedDay).padStart(2, '0') : 'DD'} ${selectedHour !== null ? String(selectedHour).padStart(2, '0') : 'HH'}:${selectedMinute !== null ? String(selectedMinute).padStart(2, '0') : 'MM'}`
                                        : 'Select Date & Time'}
                                </Text>
                            </TouchableOpacity>
                            <TextInput
                                style={styles.timelineInput}
                                placeholder="Event description"
                                value={newEventText}
                                onChangeText={setNewEventText}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.addTimelineButton,
                                    (!selectedYear || !selectedMonth || !selectedDay || selectedHour === null || selectedMinute === null || !newEventText.trim()) && styles.addTimelineButtonDisabled
                                ]}
                                onPress={validateAndAddTimelineEvent}
                                disabled={!selectedYear || !selectedMonth || !selectedDay || selectedHour === null || selectedMinute === null || !newEventText.trim()}
                            >
                                <Text style={styles.addTimelineButtonText}>Post</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {memoryDetail.photos?.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Posts</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAllText}>See All</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={memoryDetail.photos}
                            renderItem={renderPostItem}
                            keyExtractor={(item, index) => index.toString()}
                            numColumns={2}
                            scrollEnabled={false}
                            style={styles.postsGrid}
                        />
                        {isAuthorized && (
                            <TouchableOpacity style={styles.addButton} onPress={pickImageAndUpload} disabled={loading}>
                                {loading ? (
                                    <ActivityIndicator size="small" color="#5271FF" />
                                ) : (
                                    <>
                                        <PlusCircle size={40} color="#5271FF" />
                                        <Text style={styles.addButtonText}>Add Photo</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Comments</Text>
                    </View>
                </View>

                <View style={{ height: 140 }} />
            </ScrollView>

            {/* Year Picker */}
            <Modal
                visible={isYearPickerVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setYearPickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerModal}>
                        <Text style={styles.modalTitle}>Select Year</Text>
                        <FlatList
                            data={years}
                            renderItem={({ item }) => renderPickerItem(item, handleYearSelect, item === selectedYear)}
                            keyExtractor={item => item.toString()}
                            style={styles.pickerList}
                        />
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setYearPickerVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Month Picker */}
            <Modal
                visible={isMonthPickerVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setMonthPickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerModal}>
                        <Text style={styles.modalTitle}>Select Month</Text>
                        <FlatList
                            data={months}
                            renderItem={({ item }) => renderPickerItem(item, handleMonthSelect, item === selectedMonth)}
                            keyExtractor={item => item.toString()}
                            style={styles.pickerList}
                        />
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setMonthPickerVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Day Picker */}
            <Modal
                visible={isDayPickerVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setDayPickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerModal}>
                        <Text style={styles.modalTitle}>Select Day</Text>
                        <FlatList
                            data={days}
                            renderItem={({ item }) => renderPickerItem(item, handleDaySelect, item === selectedDay)}
                            keyExtractor={item => item.toString()}
                            style={styles.pickerList}
                        />
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setDayPickerVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Time Picker */}
            <Modal
                visible={isTimePickerVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setTimePickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerModal}>
                        <Text style={styles.modalTitle}>Select Time</Text>
                        <View style={styles.timePickerContainer}>
                            <FlatList
                                data={hours}
                                renderItem={({ item }) => renderPickerItem(item, (hour) => setSelectedHour(hour), item === selectedHour)}
                                keyExtractor={item => item.toString()}
                                style={styles.timePickerList}
                            />
                            <Text style={styles.timeSeparator}>:</Text>
                            <FlatList
                                data={minutes}
                                renderItem={({ item }) => renderPickerItem(item, (minute) => setSelectedMinute(minute), item === selectedMinute)}
                                keyExtractor={item => item.toString()}
                                style={styles.timePickerList}
                            />
                        </View>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setTimePickerVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={() => selectedHour !== null && selectedMinute !== null && handleTimeSelect(selectedHour, selectedMinute)}
                            >
                                <Text style={styles.confirmButtonText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={isCommentsModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setCommentsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.commentsModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Comments ({commentCount})</Text>
                            <TouchableOpacity onPress={() => setCommentsModalVisible(false)}>
                                <Text style={styles.closeModalText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={memoryDetail.comments}
                            renderItem={renderCommentItem}
                            keyExtractor={(item, index) => index.toString()}
                            style={styles.commentsList}
                        />
                        <View style={styles.commentInputContainer}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Add a comment..."
                                value={newComment}
                                onChangeText={setNewComment}
                            />
                            <TouchableOpacity 
                                style={styles.commentButton} 
                                onPress={handleAddComment}
                            >
                                <Text style={styles.commentButtonText}>Post</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={styles.memoryActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                    <Heart 
                        size={24} 
                        color={isLiked ? "#FF4444" : "#777"} 
                        fill={isLiked ? "#FF4444" : "none"}
                    />
                    <Text style={styles.actionText}>{likeCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => setCommentsModalVisible(true)}>
                    <MessageSquare size={24} color="#777" />
                    <Text style={styles.actionText}>{commentCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Share2 size={24} color="#777" />
                    <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                    <Bookmark 
                        size={24} 
                        color={isSaved ? "#5271FF" : "#777"}
                        fill={isSaved ? "#5271FF" : "none"}
                    />
                </TouchableOpacity>
            </View>

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
                    <Image 
                        source={{ uri: currentUser?.profilePic || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70) }} 
                        style={styles.navProfilePic} 
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
    },
    memoryBanner: {
        position: 'relative',
        height: 200,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    bannerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 16,
    },
    memoryCreator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    creatorAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 8,
        borderWidth: 2,
        borderColor: '#fff',
    },
    creatorName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    memoryInfo: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    memoryInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    memoryInfoText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#333',
    },
    section: {
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    seeAllText: {
        color: '#5271FF',
        fontSize: 14,
    },
    membersList: {
        paddingLeft: 16,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        padding: 8,
        marginRight: 12,
        width: 140,
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 8,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333',
    },
    memberRole: {
        fontSize: 12,
        color: '#777',
    },
    timelineList: {
        paddingHorizontal: 16,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 20,
        position: 'relative',
    },
    timelineDotContainer: {
        alignItems: 'center',
        width: 12,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#5271FF',
        zIndex: 1,
    },
    timelineLine: {
        position: 'absolute',
        top: 12,
        width: 2,
        height: '100%',
        backgroundColor: '#5271FF',
        opacity: 0.5,
    },
    timelineContent: {
        marginLeft: 16,
        flex: 1,
    },
    timelineTime: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333',
        marginBottom: 2,
    },
    timelineDescription: {
        fontSize: 14,
        color: '#555',
    },
    addTimelineContainer: {
        padding: 16,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        marginHorizontal: 16,
        marginTop: 12,
    },
    timelinePickerButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 10,
        marginBottom: 8,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    timelinePickerText: {
        fontSize: 14,
        color: '#333',
    },
    timelineInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 8,
        marginBottom: 8,
        fontSize: 14,
    },
    addTimelineButton: {
        backgroundColor: '#5271FF',
        padding: 10,
        borderRadius: 4,
        alignItems: 'center',
    },
    addTimelineButtonDisabled: {
        backgroundColor: '#ccc',
    },
    addTimelineButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    postsGrid: {
        paddingHorizontal: 12,
    },
    postItem: {
        flex: 1,
        margin: 4,
        height: 160,
        borderRadius: 8,
        overflow: 'hidden',
    },
    postImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginHorizontal: 16,
        padding: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
    },
    addButtonText: {
        marginLeft: 10,
        fontSize: 18,
        color: '#5271FF',
    },
    memoryActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#333',
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
    navProfilePic: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ddd',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
    },
    pickerModal: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
        marginHorizontal: 20,
        maxHeight: '50%',
    },
    commentsModal: {
        backgroundColor: '#fff',
        height: '70%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeModalText: {
        fontSize: 16,
        color: '#5271FF',
    },
    pickerList: {
        maxHeight: '70%',
    },
    timePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timePickerList: {
        flex: 1,
        maxHeight: '70%',
    },
    timeSeparator: {
        fontSize: 20,
        color: '#333',
        marginHorizontal: 8,
    },
    pickerItem: {
        padding: 10,
        alignItems: 'center',
    },
    pickerItemSelected: {
        backgroundColor: '#5271FF',
    },
    pickerItemText: {
        fontSize: 16,
        color: '#333',
    },
    pickerItemTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    cancelButton: {
        backgroundColor: '#ddd',
        padding: 10,
        borderRadius: 4,
        flex: 1,
        marginRight: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#333',
        fontWeight: 'bold',
    },
    confirmButton: {
        backgroundColor: '#5271FF',
        padding: 10,
        borderRadius: 4,
        flex: 1,
        marginLeft: 8,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    commentsList: {
        flex: 1,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    commentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    commentContent: {
        flex: 1,
    },
    commentAuthor: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333',
    },
    commentText: {
        fontSize: 14,
        color: '#555',
        marginVertical: 2,
    },
    commentTime: {
        fontSize: 12,
        color: '#777',
    },
    commentInputContainer: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    commentInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        padding: 8,
        marginRight: 8,
        fontSize: 14,
    },
    commentButton: {
        backgroundColor: '#5271FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        justifyContent: 'center',
    },
    commentButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default MemoryDetailScreen;