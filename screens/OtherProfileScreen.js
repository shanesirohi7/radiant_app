import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPlus } from 'lucide-react-native';
const API_URL = 'https://radiantbackend.onrender.com';

export default function OtherProfileScreen({ navigation, route }) {
    const { userId } = route.params;
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFriend, setIsFriend] = useState(false);
    const [friends, setFriends] = useState();
    const [token, setToken] = useState(null);
    useEffect(() => {
        const loadOtherProfile = async () => {
            try {
                const response = await axios.get(`${API_URL}/otherProfile/${userId}`);
                setUser(response.data);

                const token = await AsyncStorage.getItem('token');
                const friendsResponse = await axios.get(`${API_URL}/getFriends`, { headers: { token } });
                setFriends(friendsResponse.data);
            } catch (error) {
                console.error('Error fetching other profile or friends:', error);
                if (error.response) {
                    Alert.alert('Error', `Failed to load profile: ${error.response.status} ${error.response.data.error}`);
                } else if (error.request) {
                    Alert.alert('Error', 'No response from server');
                } else {
                    Alert.alert('Error', `Failed to load profile: ${error.message}`);
                }
            } finally {
                setLoading(false);
            }
        };
         

        loadOtherProfile();
    }, [userId]);
    const sendFriendRequest = async (friendId) => {
        const token = await AsyncStorage.getItem('token');
        try {
            await axios.post(
                `${API_URL}/sendFriendRequest`,
                { friendId },
                { headers: { token } }
            );
            Alert.alert('Success', 'Friend request sent!');
        } catch (error) {
            console.error('Error sending friend request:', error);
            if (error.response && error.response.data && error.response.data.error) {
                Alert.alert('Error', error.response.data.error);
            } else {
                Alert.alert('Error', 'Failed to send friend request');
            }
        }
    };
    

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Profile not found.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Profile Info Section */}
            <View style={styles.profileContainer}>
                <Image
                    source={{ uri: user?.profilePic || 'https://via.placeholder.com/150' }}
                    style={styles.profilePic}
                />
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
                <Text style={styles.friendCount}>{user?.friends?.length || 0} Friends</Text>
                {isFriend ? <Text style={styles.friendText}>Friend</Text> : (
                    <TouchableOpacity style={styles.addButton} onPress={sendFriendRequest}>
                        <Text style={styles.buttonText}>Add Friend</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Details Section */}
            <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>School</Text>
                    <Text style={styles.detailValue}>{user?.school || 'Not specified'}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Class</Text>
                    <Text style={styles.detailValue}>{user?.class || 'Not specified'} - {user?.section || 'Not specified'}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Interests</Text>
                    <View style={styles.interestsContainer}>
                        {user?.interests?.length > 0 ? (
                            user.interests.map((interest, index) => (
                                <View key={index} style={styles.interestTag}>
                                    <Text style={styles.interestText}>{interest}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noInterests}>No interests added</Text>
                        )}
                    </View>
                </View>
            </View>
            <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{user?.memories?.length || 0}</Text>
                      <Text style={styles.statLabel}>Memories</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{user?.friends?.length || 0}</Text>
                      <Text style={styles.statLabel}>Friends</Text>
                    </View>
                  </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        color: '#333',
        fontSize: 16,
    },
    header: {
        padding: 20,
        paddingTop: 40,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    addButton: {
        marginTop: 5,
        backgroundColor: '#5271FF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    settingsButton: {
        padding: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
    },
    profileContainer: {
        alignItems: 'center',
        padding: 20,
    },
    profilePic: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#5271FF',
        marginBottom: 15,
    },
    userName: {
        color: '#333',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    friendCount: {
        color: '#777',
        fontSize: 16,
    },
    detailsContainer: {
        padding: 20,
        backgroundColor: '#f9f9f9',
        borderRadius: 15,
        marginHorizontal: 15,
        marginBottom: 20,
    },
    detailItem: {
        marginBottom: 20,
    },
    detailLabel: {
        color: '#555',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
    },
    detailValue: {
        color: '#333',
        fontSize: 16,
    },
    interestsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    interestTag: {
        backgroundColor: '#5271FF',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15,
        marginRight: 8,
        marginBottom: 8,
    },
    interestText: {
        color: '#fff',
        fontSize: 14,
    },
    noInterests: {
        color: '#777',
        fontSize: 16,
        opacity: 0.7,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: '#f9f9f9',
        borderRadius: 15,
        marginHorizontal: 15,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        color: '#333',
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#777',
        fontSize: 16,
    },
    memoriesContainer: {
        padding: 10,
    },
    memoryItem: {
        flex: 1 / 3,
        margin: 5,
        alignItems: 'center',
    },
    memoryImage: {
        width: '100%',
        height: 100,
        borderRadius: 8,
    },
    memoryTitle: {
        color: '#333',
        marginTop: 5,
        fontSize: 12,
    },
});