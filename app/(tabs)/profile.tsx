
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Image, ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig';


export default function ProfileScreen() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [coins, setCoins] = useState<number | null>(null);
  const [petName, setPetName] = useState<string | null>(null);
  const [petLevel, setPetLevel] = useState<number | null>(null);


  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      setUserEmail(currentUser.email ?? null);

      const ref = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setUsername(data.username || null);
        setCoins(data.coins || 0);
        setPetName(data.petName || null);
        setPetLevel(data.petLevel || 1);
      }
    };

    fetchUserData();
  }, []);


  return (
    <ImageBackground
          source={require('../../assets/images/bg-3.png')}
          style={styles.background}
          resizeMode="cover"
        >
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
      <Image
        source={require('../../assets/images/profile-title.png')}
        style={styles.profileTitleImage}
      />
      <Image
        source={require('../../assets/images/profile-desc.png')}
        style={styles.profileDescImage}
      />

      {/* Combined Profile Section */}
      <View style={styles.profileCombinedCard}>
        {/* Avatar Image */}
        <Image
          source={require('../../assets/images/profile-pic.png')}
          style={styles.avatarImageRow}
        />

        {/* User Info */}
        <View style={styles.userInfoRow}>
          <Text style={styles.userName}>{username || 'User'}</Text>
          <Text style={styles.userEmail}>{userEmail || 'Guest'}</Text>
        </View>

        {/* Stats Grid inside the card */}
        <View style={styles.statsGrid}>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Total Steps</Text>
            <Text style={styles.statValue}>2,450</Text>
          </View>

          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Total Outfits</Text>
            <Text style={styles.statValue}>1</Text>
          </View>

          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Number of Friends</Text>
            <Text style={styles.statValue}>3</Text>
          </View>

          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Achievements</Text>
            <Text style={styles.statValue}>3</Text>
          </View>
        </View>
      </View>


      {/* Settings Section */}
      <Image
        source={require('../../assets/images/settings-title.png')}
        style={styles.settingsTitleImage}
      />
      <View style={styles.settingsList}>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Edit Profile</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Notifications</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Privacy & Security</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>About</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => router.replace('../index')}
      >
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>

      <StatusBar style="light" />
    </ScrollView>
    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffffff',
    marginTop: 12,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#ffffffff',
  },
  settingsList: {
    backgroundColor: '#62c1e5',
    borderRadius: 14,
    marginBottom: 24,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#4d99b4ff',
  },
  settingText: {
    fontSize: 14,
    color: '#ffffffff',
  },
  settingArrow: {
    fontSize: 18,
    color: '#9ca3af',
  },
  logoutButton: {
    backgroundColor: '#FA9578',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  background: {
    flex: 1,
  },
  profileTitleImage: {
    width: 300,
    height: 60,
    resizeMode: 'contain',
  },
  profileDescImage: {
    width: 300,
    height: 60,
    resizeMode: 'contain',
  },
  settingsTitleImage: {
    width: 200,
    height: 60,
    resizeMode: 'contain',
  },
  profileCombinedCard: {
    backgroundColor: '#62c1e5',
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  statsGrid: {
    width: '100%',
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBlock: {
    width: '48%',
    backgroundColor: '#1c96c5',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#126382',
  },
  statLabel: {
    fontSize: 15,
    color: '#ffffffff',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffffff',
  },
  profileCombinedCardRow: {
    flexDirection: 'row',         // place avatar and text side by side
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarImageRow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  userInfoRow: {
    flex: 1,                      // take remaining space
    justifyContent: 'center',
  },

});