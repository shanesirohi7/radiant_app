import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { PlusCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

const API_URL = 'https://radiantbackend.onrender.com';

const MemoryDetailScreen = ({ route }) => {
    const memory = route.params?.memory;
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [memoryDetail, setMemoryDetail] = useState(null);

    useEffect(() => {
        const loadCurrentUser = async () => {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                try {
                    const res = await axios.get(`${API_URL}/profile`, { headers: { token } });
                    setCurrentUser(res.data);
                } catch (err) {
                    console.error('Error loading current user:', err);
                }
            }
        };
        loadCurrentUser();
        fetchMemoryDetail();
    }, []);

    const fetchMemoryDetail = async () => {
        try {
            const res = await axios.get(`${API_URL}/memory/${memory._id}`);
            setMemoryDetail(res.data);
        } catch (error) {
            console.error('Error fetching memory detail:', error);
            Alert.alert('Error', 'Could not fetch memory details.');
        }
    };

    if (!memoryDetail) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading memory...</Text>
            </View>
        );
    }

    const isAuthorized = currentUser && (
        currentUser._id === memoryDetail.author._id ||
        memoryDetail.taggedFriends?.some(friend => friend._id === currentUser._id)
    );

    const pickImageAndUpload = async () => {
        try {
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
            Alert.alert('Upload Failed', 'Could not upload photo.');
        }
        setLoading(false);
    };

    const addPhotoToMemory = async (photoUrl) => {
        const token = await AsyncStorage.getItem('token');
        try {
            await axios.post(
                `${API_URL}/memory/${memoryDetail._id}/addPhoto`,
                { photoUrl },
                { headers: { token } }
            );
            fetchMemoryDetail();
        } catch (error) {
            console.error('Add Photo Error:', error);
            Alert.alert('Error', 'Could not add photo to memory.');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>{memoryDetail.title}</Text>

            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tagged:</Text>
                <Text style={styles.detailValue}>
                    {memoryDetail.taggedFriends?.map(friend => friend.name).join(', ') || 'No tagged users'}
                </Text>
            </View>

            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Author:</Text>
                <Text style={styles.detailValue}>{memoryDetail.author?.name}</Text>
            </View>

            <View style={styles.photoGrid}>
                {memoryDetail.photos?.map((photo, index) => (
                   <Image
                   key={index}
                   source={{ uri: photo }}
                   style={{
                       height: 200, // Or a fixed pixel value
                       resizeMode: 'cover', // Or 'contain', 'stretch', etc.
                       borderRadius: 8,
                       width: '30%',
        aspectRatio: 1,
        margin: '1.5%',
        borderRadius: 8,
        backgroundColor: 'lightcoral',
                   }}
                   onError={(error) => console.error('Image Load Error:', error, photo)}
               />
                ))}
            </View>

            {isAuthorized && (
                <TouchableOpacity style={styles.addButton} onPress={pickImageAndUpload}>
                    {loading ? <ActivityIndicator size="small" color="#5271FF" /> :
                        <>
                            <PlusCircle size={40} color="#5271FF" />
                            <Text style={styles.addButtonText}>Add Photo</Text>
                        </>
                    }
                </TouchableOpacity>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 18,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    detailLabel: {
        fontWeight: '600',
        marginRight: 10,
        color: '#555',
    },
    detailValue: {
        color: '#333',
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 20,
        justifyContent: 'flex-start',
    },
    photo: {
        width: '30%',
        aspectRatio: 1,
        margin: '1.5%',
        borderRadius: 8,
        backgroundColor: 'lightcoral', //add this line
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        padding: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
    },
    addButtonText: {
        marginLeft: 10,
        fontSize: 18,
        color: '#5271FF',
    },
});

export default MemoryDetailScreen;