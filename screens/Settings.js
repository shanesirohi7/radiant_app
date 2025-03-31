import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
  FlatList,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Audio } from 'expo-av';
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  HelpCircle,
  LogOut,
  User,
  Lock,
  Globe,
  MessageCircle,
  Share2,
  FileText,
  Info,
  Palette,
  Volume2,
  Check,
} from 'lucide-react-native';

const API_URL = 'https://radiantbackend.onrender.com';

// Theme options
const themes = {
  light: {
    background: "#FFFFFF",
    primary: "#8ECAE6",
    secondary: "#FF007F",
    text: "#000000",
    accent: "#58D68D",
  },
  dark: {
    background: "#121212",
    primary: "#BB86FC",
    secondary: "#03DAC6",
    text: "#EAEAEA",
    accent: "#CF6679",
  },
  cyberpunk: {
    background: "#000000",
    primary: "#FF007F",
    secondary: "#00FFFF",
    text: "#FFFFFF",
    accent: "#FFD700",
  },
  bumblebee: {
    background: "#FFF4A3",
    primary: "#FFC107",
    secondary: "#FF9800",
    text: "#000000",
    accent: "#6A1B9A",
  },
  synthwave: {
    background: "#1A1A40",
    primary: "#FF00FF",
    secondary: "#00A3FF",
    text: "#F8F8F2",
    accent: "#FFD700",
  },
  luxury: {
    background: "#000000",
    primary: "#FFFFFF",
    secondary: "#1A1A1A",
    text: "#FFD700",
    accent: "#800080",
  },
  halloween: {
    background: "#181818",
    primary: "#FF8C00",
    secondary: "#800080",
    text: "#FFFFFF",
    accent: "#008000",
  },
  aqua: {
    background: "#00FFFF",
    primary: "#6A5ACD",
    secondary: "#FFD700",
    text: "#000000",
    accent: "#4682B4",
  },
  dracula: {
    background: "#282A36",
    primary: "#BD93F9",
    secondary: "#FFB86C",
    text: "#F8F8F2",
    accent: "#50FA7B",
  },
  forest: {
    background: "#0B3D02",
    primary: "#4CAF50",
    secondary: "#3E8E41",
    text: "#FFFFFF",
    accent: "#228B22",
  },
};

export default function Settings() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState('light');
  const [sendSound, setSendSound] = useState('Send1');
  const [receiveSound, setReceiveSound] = useState('Receive1');
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [soundModalVisible, setSoundModalVisible] = useState(false);

  // Available sounds
  const sendSounds = ['Send1', 'Send2', 'Send3', 'Send4', 'Send5'];
  const receiveSounds = ['Receive1', 'Receive2', 'Receive3', 'Receive4', 'Receive5', 'Receive6'];

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
        
        // Load theme settings from AsyncStorage
        const themeSetting = await AsyncStorage.getItem('theme');
        if (themeSetting !== null) {
          setCurrentTheme(themeSetting);
        }
        
        // Load sound settings from AsyncStorage
        const sendSoundSetting = await AsyncStorage.getItem('sendSound');
        if (sendSoundSetting !== null) {
          setSendSound(sendSoundSetting);
        }
        
        const receiveSoundSetting = await AsyncStorage.getItem('receiveSound');
        if (receiveSoundSetting !== null) {
          setReceiveSound(receiveSoundSetting);
        }
        
        const soundsEnabledSetting = await AsyncStorage.getItem('soundsEnabled');
        if (soundsEnabledSetting !== null) {
          setSoundsEnabled(soundsEnabledSetting === 'true');
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserSettings();
  }, [navigation]);

  const handleThemeChange = async (theme) => {
    setCurrentTheme(theme);
    await AsyncStorage.setItem('theme', theme);
    setThemeModalVisible(false);
  };

  const handleSendSoundChange = async (sound) => {
    setSendSound(sound);
    await AsyncStorage.setItem('sendSound', sound);
    playSoundPreview(sound);
  };

  const handleReceiveSoundChange = async (sound) => {
    setReceiveSound(sound);
    await AsyncStorage.setItem('receiveSound', sound);
    playSoundPreview(sound);
  };

  const toggleSoundsEnabled = async () => {
    const newValue = !soundsEnabled;
    setSoundsEnabled(newValue);
    await AsyncStorage.setItem('soundsEnabled', newValue.toString());
  };

  const getSoundResource = (soundName) => {
    // Send sounds
    if (soundName === 'Send1') return require('../assets/Send/Send1.mp3');
    if (soundName === 'Send2') return require('../assets/Send/Send2.mp3');
    if (soundName === 'Send3') return require('../assets/Send/Send3.mp3');
    if (soundName === 'Send4') return require('../assets/Send/Send4.mp3');
    if (soundName === 'Send5') return require('../assets/Send/Send5.mp3');
    
    // Receive sounds
    if (soundName === 'Receive1') return require('../assets/Receive/Receive1.mp3');
    if (soundName === 'Receive2') return require('../assets/Receive/Receive2.mp3');
    if (soundName === 'Receive3') return require('../assets/Receive/Receive3.mp3');
    if (soundName === 'Receive4') return require('../assets/Receive/Receive4.mp3');
    if (soundName === 'Receive5') return require('../assets/Receive/Receive5.mp3');
    if (soundName === 'Receive6') return require('../assets/Receive/Receive6.mp3');
    
    // Default
    return require('../assets/Send/Send1.mp3');
  };

  const playSoundPreview = async (soundName) => {
    try {
      const soundResource = getSoundResource(soundName);
      const { sound } = await Audio.Sound.createAsync(soundResource);
      await sound.playAsync();
      
      // Unload sound after playing
      setTimeout(() => {
        sound.unloadAsync();
      }, 2000);
    } catch (error) {
      console.error('Error playing sound:', error);
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

  const SettingItem = ({ icon, title, onPress, value, showArrow = true }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
    >
      <View style={styles.settingItemLeft}>
        {icon}
        <Text style={styles.settingItemTitle}>{title}</Text>
      </View>
      {value ? (
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

  const ThemeColorPreview = ({ colors, isSelected }) => (
    <View style={[styles.themePreview, isSelected && styles.themePreviewSelected]}>
      <View style={[styles.colorSwatch, { backgroundColor: colors.primary }]} />
      <View style={[styles.colorSwatch, { backgroundColor: colors.secondary }]} />
      <View style={[styles.colorSwatch, { backgroundColor: colors.accent }]} />
      {isSelected && <Check size={16} color="#fff" style={styles.checkIcon} />}
    </View>
  );

  const renderThemeModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={themeModalVisible}
      onRequestClose={() => setThemeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Theme</Text>
            <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
              <Text style={styles.modalCloseButton}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={Object.entries(themes)}
            keyExtractor={([name]) => name}
            renderItem={({ item: [name, colors] }) => (
              <TouchableOpacity
                style={styles.themeItem}
                onPress={() => handleThemeChange(name)}
              >
                <Text style={styles.themeName}>{name.charAt(0).toUpperCase() + name.slice(1)}</Text>
                <ThemeColorPreview colors={colors} isSelected={currentTheme === name} />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderSoundModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={soundModalVisible}
      onRequestClose={() => setSoundModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sound Settings</Text>
            <TouchableOpacity onPress={() => setSoundModalVisible(false)}>
              <Text style={styles.modalCloseButton}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.soundToggleOption}
            onPress={toggleSoundsEnabled}
          >
            <View style={styles.soundToggleContainer}>
              <Text style={styles.soundToggleText}>Enable Message Sounds</Text>
              <View style={[
                styles.toggleSwitch, 
                soundsEnabled ? styles.toggleSwitchOn : styles.toggleSwitchOff
              ]}>
                <View style={[
                  styles.toggleKnob,
                  soundsEnabled ? styles.toggleKnobOn : styles.toggleKnobOff
                ]} />
              </View>
            </View>
          </TouchableOpacity>
          
          {soundsEnabled && (
            <>
              <Text style={styles.soundSectionTitle}>When Sending Messages</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.soundsRow}>
                {sendSounds.map((sound) => (
                  <TouchableOpacity
                    key={sound}
                    style={[
                      styles.soundOption,
                      sendSound === sound && styles.soundOptionSelected
                    ]}
                    onPress={() => handleSendSoundChange(sound)}
                  >
                    <Text 
                      style={[
                        styles.soundOptionText,
                        sendSound === sound && styles.soundOptionTextSelected
                      ]}
                    >
                      {sound}
                    </Text>
                    {sendSound === sound && <Check size={16} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.soundSectionTitle}>When Receiving Messages</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.soundsRow}>
                {receiveSounds.map((sound) => (
                  <TouchableOpacity
                    key={sound}
                    style={[
                      styles.soundOption,
                      receiveSound === sound && styles.soundOptionSelected
                    ]}
                    onPress={() => handleReceiveSoundChange(sound)}
                  >
                    <Text 
                      style={[
                        styles.soundOptionText,
                        receiveSound === sound && styles.soundOptionTextSelected
                      ]}
                    >
                      {sound}
                    </Text>
                    {receiveSound === sound && <Check size={16} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
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
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection title="Preferences">
          <SettingItem
            icon={<Palette size={20} color="#5271FF" />}
            title="Theme"
            value={currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)}
            onPress={() => setThemeModalVisible(true)}
          />
          <SettingItem
            icon={<Volume2 size={20} color="#5271FF" />}
            title="Sound Settings"
            value={soundsEnabled ? "On" : "Off"}
            onPress={() => setSoundModalVisible(true)}
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

      {/* Theme Modal */}
      {renderThemeModal()}

      {/* Sound Settings Modal */}
      {renderSoundModal()}
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    color: '#5271FF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Theme modal styles
  themeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  themeName: {
    fontSize: 16,
    color: '#333',
  },
  themePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 2,
  },
  themePreviewSelected: {
    backgroundColor: '#5271FF',
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  checkIcon: {
    position: 'absolute',
    right: -8,
    top: -8,
  },
  // Sound modal styles
  soundSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  soundsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  soundOption: {
    backgroundColor: '#f0f2f5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundOptionSelected: {
    backgroundColor: '#5271FF',
  },
  soundOptionText: {
    color: '#333',
    fontWeight: '500',
    marginRight: 4,
  },
  soundOptionTextSelected: {
    color: '#fff',
  },
  soundToggleOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  soundToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soundToggleText: {
    fontSize: 16,
    color: '#333',
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 3,
  },
  toggleSwitchOn: {
    backgroundColor: '#5271FF',
  },
  toggleSwitchOff: {
    backgroundColor: '#d0d0d0',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  toggleKnobOff: {
    alignSelf: 'flex-start',
  },
});