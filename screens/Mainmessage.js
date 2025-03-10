import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, FlatList } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';

const conversations = [
    { id: '1', name: 'Emma Wilson', lastMessage: 'Received a snap', time: '2m', unread: true, isSnap: true, streak: 48 },
    { id: '2', name: 'James Rodriguez', lastMessage: 'Hey, what are you up to?', time: '15m', unread: true, isSnap: false },
    { id: '3', name: 'Olivia Parker', lastMessage: 'Received a snap', time: '1h', unread: false, isSnap: true, streak: 215 },
    { id: '4', name: 'Ethan Clark', lastMessage: 'Sent a snap', time: '3h', isSnap: true },
    { id: '5', name: 'Sophia Martinez', lastMessage: 'Thanks!', time: '5h', isSnap: false, streak: 24 },
];

const AvatarInitials = ({ name }) => {
    const initials = name.split(' ').map(part => part.charAt(0)).join('');
    return (
        <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
        </View>
    );
};

const Mainmessage = () => {
    const route = useRoute();
    const userName = route.params?.userName || 'User';

    const renderConversationItem = ({ item }) => (
        <TouchableOpacity style={styles.conversationItem} onPress={() => console.log(`Navigating to chat with ${item.name}`)}>
            <AvatarInitials name={item.name} />
            <View style={styles.conversationDetails}>
                <View style={styles.nameRow}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                </View>
                <View style={styles.messageRow}>
                    {item.isSnap && (
                        <Text style={[styles.snapIcon, item.unread && styles.unreadIcon]}>
                            {item.unread ? '■' : '□'}
                        </Text>
                    )}
                    <Text style={[styles.lastMessage, item.unread && styles.unreadMessage]} numberOfLines={1}>
                        {item.lastMessage}
                    </Text>
                    {item.streak > 0 && (
                        <View style={styles.streakContainer}>
                            <Text style={styles.streakNumber}>{item.streak}</Text>
                            <Text style={styles.streakIcon}>🔥</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View style={styles.header}>
                <Text style={styles.greeting}>Hi, {userName}!</Text>
                <TouchableOpacity style={styles.newChatButton} onPress={() => console.log('New chat button pressed')}>
                    <Plus size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={conversations}
                renderItem={renderConversationItem}
                keyExtractor={(item) => item.id}
                style={styles.list}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greeting: { fontSize: 20, fontWeight: 'bold' },
    newChatButton: {
        width: 56, height: 56, borderRadius: 28, backgroundColor: '#3498db', justifyContent: 'center', alignItems: 'center',
    },
    list: { flex: 1 },
    conversationItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F2', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#DDD', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
    conversationDetails: { flex: 1, justifyContent: 'center' },
    nameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    name: { fontSize: 16, fontWeight: '500' },
    time: { fontSize: 14, color: '#9B9B9B' },
    messageRow: { flexDirection: 'row', alignItems: 'center' },
    snapIcon: { marginRight: 6, fontSize: 12, color: '#9B9B9B' },
    unreadIcon: { color: '#ff0000' },
    lastMessage: { fontSize: 14, color: '#9B9B9B', flex: 1 },
    unreadMessage: { fontWeight: '500', color: '#333' },
    streakContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 6 },
    streakNumber: { fontSize: 14, marginRight: 4 },
    streakIcon: { fontSize: 14 },
});

export default Mainmessage;