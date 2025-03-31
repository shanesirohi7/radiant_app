import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Image,
    Modal,
    ActivityIndicator,
    Animated,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPlus, X, ChevronLeft, ChevronRight } from 'lucide-react-native';

const API_URL = 'https://radiantbackend.onrender.com';

const RecommendationsPopup = ({ visible, onClose, onAddFriend }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const fadeAnim = useState(new Animated.Value(0))[0]; // Animation for fade-in

    useEffect(() => {
        const fetchToken = async () => {
            const storedToken = await AsyncStorage.getItem('token');
            if (storedToken) {
                setToken(storedToken);
                fetchRecommendations(storedToken);
            }
        };
        if (visible) {
            fetchToken();
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const fetchRecommendations = async (token) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/recommendUsers`, {
                headers: { token },
            });
            const data = Array.isArray(response.data) ? response.data : [];
            setRecommendations(data);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            setRecommendations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFriend = async (friendId) => {
        try {
            await axios.post(
                `${API_URL}/sendFriendRequest`,
                { friendId },
                { headers: { token } }
            );
            onAddFriend(friendId); // Callback to update friend count in parent
            setRecommendations(recommendations.filter((user) => user._id !== friendId));
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    const handleNext = () => {
        if (currentIndex < recommendations.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const renderRecommendation = ({ item }) => (
        <View style={styles.card}>
            <Image
                source={{ uri: item.profilePic }}
                style={styles.cardImage}
                resizeMode="cover"
            />
            <View style={styles.cardContent}>
                <Text style={styles.cardName}>{item.name}, 16</Text>
                <Text style={styles.cardBio}>"{item.bio || 'No bio yet'}"</Text>
                <View style={styles.cardDetails}>
                    <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Class: </Text>
                        {item.class} - {item.section}
                    </Text>
                    <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Interests: </Text>
                        {item.interשיםests?.join(', ') || 'Not specified'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddFriend(item._id)}
                >
                    <UserPlus size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Add Friend</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="none">
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <View style={styles.popup}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <X size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Find Your First Friend!</Text>
                    {loading ? (
                        <ActivityIndicator size="large" color="#5271FF" style={styles.loader} />
                    ) : recommendations.length === 0 ? (
                        <Text style={styles.noResults}>No recommendations available right now.</Text>
                    ) : (
                        <View style={styles.content}>
                            <FlatList
                                data={[recommendations[currentIndex]]} // Show one at a time
                                renderItem={renderRecommendation}
                                keyExtractor={(item) => item._id}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                style={styles.flatList}
                            />
                            <View style={styles.navigation}>
                                <TouchableOpacity
                                    style={[styles.navButton, currentIndex === 0 && styles.disabledButton]}
                                    onPress={handlePrev}
                                    disabled={currentIndex === 0}
                                >
                                    <ChevronLeft size={24} color={currentIndex === 0 ? '#aaa' : '#fff'} />
                                </TouchableOpacity>
                                <Text style={styles.counter}>
                                    {currentIndex + 1} / {recommendations.length}
                                </Text>
                                <TouchableOpacity
                                    style={[
                                        styles.navButton,
                                        currentIndex === recommendations.length - 1 && styles.disabledButton,
                                    ]}
                                    onPress={handleNext}
                                    disabled={currentIndex === recommendations.length - 1}
                                >
                                    <ChevronRight size={24} color={currentIndex === recommendations.length - 1 ? '#aaa' : '#fff'} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popup: {
        width: '90%',
        backgroundColor: '#1a0d2b',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        padding: 5,
        zIndex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
    },
    loader: {
        marginVertical: 20,
    },
    noResults: {
        fontSize: 16,
        color: '#aaa',
        textAlign: 'center',
        marginVertical: 20,
    },
    content: {
        flex: 1,
        alignItems: 'center',
    },
    flatList: {
        width: '100%',
    },
    card: {
        width: 300,
        backgroundColor: '#fff',
        borderRadius: 15,
        overflow: 'hidden',
        marginHorizontal: 10,
        elevation: 5,
    },
    cardImage: {
        width: '100%',
        height: 200,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    cardContent: {
        padding: 15,
        alignItems: 'center',
    },
    cardName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 5,
    },
    cardBio: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#666',
        marginBottom: 10,
        textAlign: 'center',
    },
    cardDetails: {
        width: '100%',
        marginBottom: 15,
    },
    detailText: {
        fontSize: 14,
        color: '#444',
        marginBottom: 5,
    },
    detailLabel: {
        fontWeight: '600',
        color: '#5271FF',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5271FF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        shadowColor: '#5271FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 3,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    navigation: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '80%',
        marginTop: 20,
    },
    navButton: {
        backgroundColor: '#5271FF',
        padding: 10,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#555',
    },
    counter: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
});

export default RecommendationsPopup;