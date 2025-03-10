import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    StyleSheet,
    FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Settings } from 'lucide-react-native';

const API_URL = 'https://radiantbackend.onrender.com';

export default function ProfileScreen() {
    const navigation = useNavigation();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                navigation.replace('Login');
                return;
            }
            try {
                const res = await axios.get(`${API_URL}/profile`, {
                    headers: { token }
                });
                setUser(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    // Dummy data for memories (replace with actual data later)
    const createdMemories = [
        { id: '1', title: 'Trip to Beach', taggedUsers: ['Alice', 'Bob'] },
        { id: '2', title: 'Birthday Party', taggedUsers: ['Charlie', 'David'] },
        { id: '3', title: 'Graduation Day', taggedUsers: ['Eve', 'Frank'] },
        { id: '4', title: 'Another Memory', taggedUsers: ['Grace', 'Henry'] },
        { id: '5', title: 'Random Event', taggedUsers: ['Ivy', 'Jack'] },
    ];

    const taggedMemories = [
        { id: '6', title: 'Summer Picnic', taggedUsers: ['Kevin', 'Laura'] },
        { id: '7', title: 'Winter Hike', taggedUsers: ['Mike', 'Nancy'] },
        { id: '8', title: 'Concert Night', taggedUsers: ['Oliver', 'Penny'] },
        { id: '9', title: 'Family Reunion', taggedUsers: ['Quinn', 'Robert'] },
    ];

    const renderMemoryGridItem = ({ item }) => (
        <View style={styles.memoryGridItem}>
            <Text style={styles.memoryGridTitle}>{item.title}</Text>
            <Text style={styles.memoryGridUsers}>
                Tagged: {item.taggedUsers.join(', ')}
            </Text>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Settings size={24} color="black" />
                </TouchableOpacity>
            </View>

            {/* Profile Info Section */}
            <View style={styles.profileContainer}>
                <Image
                    source={{ uri: user?.profilePic || 'https://via.placeholder.com/150' }}
                    style={styles.profilePic}
                />
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
                <Text style={styles.friendCount}>{user?.friends?.length || 0} Friends</Text>
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

            {/* Stats Section */}
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

            {/* Memories Created Section */}
            <Text style={styles.sectionTitle}>Memories Created</Text>
            <FlatList
                data={createdMemories}
                renderItem={renderMemoryGridItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                style={styles.memoryGridContainer}
            />

            {/* Memories Tagged In Section */}
            <Text style={styles.sectionTitle}>Memories Tagged In</Text>
            <FlatList
                data={taggedMemories}
                renderItem={renderMemoryGridItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                style={styles.memoryGridContainer}
            />
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
        color:'#777',
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
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        padding: 15,
        color: '#333',
    },
    memoryGridContainer: {
        paddingHorizontal: 10,
    },
    memoryGridItem: {
        flex: 1 / 2,
        margin: 8,
        padding: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    memoryGridTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    memoryGridUsers: {
        fontSize: 14,
        color: '#777',
        marginTop: 5,
    },
});