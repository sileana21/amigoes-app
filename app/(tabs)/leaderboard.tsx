import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ImageBackground, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { getLeaderboard, getUserProfile } from '../userProfileService';

type LeaderboardEntry = {
  id: string;
  name: string;
  steps: number;
  rank: number;
  isCurrentUser?: boolean;
};

export default function LeaderboardScreen() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendsList, setFriendsList] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (user) {
          setCurrentUserId(user.uid);
        }
        
        const leaderboardData = await getLeaderboard(50);
        const dataWithUser = leaderboardData.map(entry => ({
          ...entry,
          isCurrentUser: entry.id === user?.uid,
        }));
        setData(dataWithUser);
      } catch (e) {
        console.log('Error loading leaderboard:', e);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
    loadFriends();
  }, []);

  // load friends from subcollection users/{uid}/friends
  const loadFriends = async () => {
    setFriendsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setFriendsList([]);
        return;
      }

      // load current user's profile for their steps and name
      const profile = await getUserProfile(user.uid);
      const selfEntry: LeaderboardEntry = {
        id: user.uid,
        name: 'You',
        steps: profile?.dailySteps || 0,
        rank: 0,
        isCurrentUser: true,
      };

      const friendsRef = collection(db, 'users', user.uid, 'friends');
      const snap = await getDocs(friendsRef);

      // For each friend doc, resolve the friend's user document to get authoritative username and dailySteps
      const friendUids = snap.docs.map(d => d.id);
      const friendProfiles = await Promise.all(friendUids.map(async (fid) => {
        const p = await getUserProfile(fid);
        return { uid: fid, profile: p } as any;
      }));

      const loaded: LeaderboardEntry[] = friendProfiles.map(fp => ({
        id: fp.uid,
        name: fp.profile?.username || 'Friend',
        steps: fp.profile?.dailySteps || 0,
        rank: 0,
      }));

      // merge self + friends and sort
      const merged = [selfEntry, ...loaded].sort((a, b) => b.steps - a.steps).map((it, idx) => ({ ...it, rank: idx + 1 }));
      setFriendsList(merged);
    } catch (e) {
      console.log('Error loading friends leaderboard', e);
    } finally {
      setFriendsLoading(false);
    }
  };

  
  return (
    <ImageBackground source={require('../../assets/images/bg-2.png')} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Image source={require('../../assets/images/steps-title.png')} style={styles.titleImage} />
            <Text style={styles.subtitle}>Top amiGOs</Text>
          </View>
        </View>

        {/* Friends leaderboard (personal) */}
        <Text style={styles.sectionTitle}>Friends</Text>
        {friendsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : (
          <FlatList
            data={friendsList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={[styles.row, item.isCurrentUser && styles.rowHighlight]}>
                <View style={[styles.rankCircle, item.isCurrentUser && styles.rankCircleHighlight]}>
                  <Text style={styles.rankText}>{item.rank}</Text>
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.isCurrentUser ? 'You' : item.name}</Text>
                  <Text style={styles.userSub}>Steps: {item.steps.toLocaleString()}</Text>
                </View>

                <View style={[styles.avatarPlaceholder, item.isCurrentUser && styles.avatarHighlight]}>
                  <Text style={styles.avatarText}>{item.isCurrentUser ? 'Y' : item.name.charAt(0)}</Text>
                </View>
              </View>
            )}
          />
        )}

        {/* Global leaderboard */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Global Top</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={[styles.row, item.isCurrentUser && styles.rowHighlight]}>
                <View style={[styles.rankCircle, item.isCurrentUser && styles.rankCircleHighlight]}>
                  <Text style={styles.rankText}>{item.rank}</Text>
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.isCurrentUser ? 'You' : item.name}</Text>
                  <Text style={styles.userSub}>Steps: {item.steps.toLocaleString()}</Text>
                </View>

                <View style={[styles.avatarPlaceholder, item.isCurrentUser && styles.avatarHighlight]}>
                  <Text style={styles.avatarText}>{item.isCurrentUser ? 'Y' : item.name.charAt(0)}</Text>
                </View>
              </View>
            )}
          />
        )}

        
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 8, paddingBottom: 12 },
  titleImage: { width: 220, height: 48, resizeMode: 'contain' },
  subtitle: { color: '#ffffff', fontSize: 14, marginTop: 6 },
  list: { padding: 16 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rowHighlight: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderColor: 'rgba(255,215,0,0.5)',
  },
  rankCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFD54F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankCircleHighlight: {
    backgroundColor: '#FFF700',
    borderWidth: 2,
    borderColor: '#fff',
  },
  rankText: { fontWeight: '800', color: '#000' },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  userSub: { color: '#e5e7eb', marginTop: 4 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHighlight: {
    backgroundColor: '#FFD54F',
  },
  avatarText: { fontWeight: '700', color: '#000' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 6 },
  headerLeft: { alignItems: 'flex-start' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 6, paddingHorizontal: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, width: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  modalInput: { backgroundColor: '#f3f4f6', padding: 10, borderRadius: 8, marginTop: 8 },
  textButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, minWidth: 100, alignItems: 'center' },
  textButtonPrimary: { backgroundColor: '#4CAF50' },
  textButtonSecondary: { backgroundColor: '#888' },
  textButtonText: { color: '#fff', fontWeight: '700' },
});
