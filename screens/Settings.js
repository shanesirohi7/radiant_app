import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Moon,
  User,
  Lock,
  Globe,
  MessageCircle,
  Share2,
  FileText,
  Info,
} from 'lucide-react-native';

const API_URL = 'https://radiantbackend.onrender.com';

export default function Settings() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);

  useEffect(() => {
    const loadUserSettings = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('Login');
        return;
      }
      
      try {
        // Load user data
        const res = await axios.get(`${API_URL}/profile`, {
          headers: { token },
        });
        setUser(res.data);
        
        // Load settings from AsyncStorage
        const darkModeSetting = await AsyncStorage.getItem('darkMode');
        if (darkModeSetting !== null) {
          setDarkMode(darkModeSetting === 'true');
        }
        
        const notificationsSetting = await AsyncStorage.getItem('notifications');
        if (notificationsSetting !== null) {
          setNotificationsEnabled(notificationsSetting === 'true');
        }
        
        setPrivateAccount(res.data.isPrivate || false);
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserSettings();
  }, [navigation]);

  const handleDarkModeToggle = async (value) => {
    setDarkMode(value);
    await AsyncStorage.setItem('darkMode', value.toString());
  };

  const handleNotificationsToggle = async (value) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications', value.toString());
  };

  const handlePrivateAccountToggle = async (value) => {
    setPrivateAccount(value);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/updatePrivacy`, 
        { isPrivate: value },
        { headers: { token } }
      );
    } catch (err) {
      console.error('Error updating privacy settings:', err);
      // Revert the toggle if update fails
      setPrivateAccount(!value);
      Alert.alert('Error', 'Failed to update privacy settings. Please try again.');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, onPress, value, toggleSwitch, showArrow = true }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={toggleSwitch !== undefined}
    >
      <View style={styles.settingItemLeft}>
        {icon}
        <Text style={styles.settingItemTitle}>{title}</Text>
      </View>
      {toggleSwitch !== undefined ? (
        <Switch
          trackColor={{ false: '#d0d0d0', true: '#cad2ff' }}
          thumbColor={toggleSwitch ? '#5271FF' : '#f4f3f4'}
          ios_backgroundColor="#d0d0d0"
          onValueChange={onPress}
          value={toggleSwitch}
        />
      ) : value ? (
        <Text style={styles.settingItemValue}>{value}</Text>
      ) : showArrow ? (
        <ChevronRight size={20} color="#777" />
      ) : null}
    </TouchableOpacity>
  );

  const SettingsSection = ({ title, children }) => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color="#5271FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {user && (
            <View style={styles.profileInfo}>
              <Image
                source={{ uri: user.profilePic || 'https://via.placeholder.com/150' }}
                style={styles.profileAvatar}
              />
              <View style={styles.profileText}>
                <Text style={styles.profileName}>{user.name}</Text>
                <Text style={styles.profileUsername}>
                  {user.instagramUsername || '@' + (user.username || '')}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.editProfileButton}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Text style={styles.editProfileButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Account Settings */}
        <SettingsSection title="Account">
          <SettingItem
            icon={<User size={20} color="#5271FF" />}
            title="Personal Information"
            onPress={() => navigation.navigate('PersonalInformation')}
          />
          <SettingItem
            icon={<Lock size={20} color="#5271FF" />}
            title="Privacy"
            onPress={() => navigation.navigate('PrivacySettings')}
          />
          <SettingItem
            icon={<Shield size={20} color="#5271FF" />}
            title="Security"
            onPress={() => navigation.navigate('SecuritySettings')}
          />
          <SettingItem
            icon={<Bell size={20} color="#5271FF" />}
            title="Notifications"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection title="Preferences">
          <SettingItem
            icon={<Moon size={20} color="#5271FF" />}
            title="Dark Mode"
            onPress={handleDarkModeToggle}
            toggleSwitch={darkMode}
          />
          <SettingItem
            icon={<Bell size={20} color="#5271FF" />}
            title="Enable Notifications"
            onPress={handleNotificationsToggle}
            toggleSwitch={notificationsEnabled}
          />
          <SettingItem
            icon={<Lock size={20} color="#5271FF" />}
            title="Private Account"
            onPress={handlePrivateAccountToggle}
            toggleSwitch={privateAccount}
          />
          <SettingItem
            icon={<Globe size={20} color="#5271FF" />}
            title="Language"
            value="English"
            onPress={() => navigation.navigate('LanguageSettings')}
          />
        </SettingsSection>

        {/* Support & About */}
        <SettingsSection title="Support & About">
          <SettingItem
            icon={<HelpCircle size={20} color="#5271FF" />}
            title="Help Center"
            onPress={() => navigation.navigate('HelpCenter')}
          />
          <SettingItem
            icon={<MessageCircle size={20} color="#5271FF" />}
            title="Report a Problem"
            onPress={() => navigation.navigate('ReportProblem')}
          />
          <SettingItem
            icon={<FileText size={20} color="#5271FF" />}
            title="Terms of Service"
            onPress={() => navigation.navigate('TermsOfService')}
          />
          <SettingItem
            icon={<FileText size={20} color="#5271FF" />}
            title="Privacy Policy"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <SettingItem
            icon={<Info size={20} color="#5271FF" />}
            title="About"
            onPress={() => navigation.navigate('AboutApp')}
          />
          <SettingItem
            icon={<Share2 size={20} color="#5271FF" />}
            title="Invite Friends"
            onPress={() => navigation.navigate('InviteFriends')}
          />
        </SettingsSection>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#fff' 
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
  backButton: { 
    padding: 4 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#5271FF' 
  },
  content: { 
    flex: 1 
  },
  profileSection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#f0f2f5',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#5271FF',
  },
  profileText: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  profileUsername: {
    fontSize: 14,
    color: '#777',
  },
  editProfileButton: {
    backgroundColor: '#f0f2f5',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  editProfileButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  settingsSection: {
    marginTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#777',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemTitle: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  settingItemValue: {
    fontSize: 14,
    color: '#777',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
    marginHorizontal: 16,
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    color: '#777',
    fontSize: 12,
    marginVertical: 24,
  },
});