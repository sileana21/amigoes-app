import { useFocusEffect, useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Image, ImageBackground, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig';
import StepTracker from "../stepCounter";
import { acceptFriendRequest, declineFriendRequest, getUserByUsername, getUserProfile, sendFriendRequest, setUsername, updateDailySteps } from '../userProfileService';


type UserProfile = {
  email?: string;
  coins: number;
  petName: string;
  petLevel: number;
  dailySteps?: number;
};

const DAILY_GOAL = 10000; // you can change this later

export default function HomeScreen() {
  const router = useRouter();
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);

  // Local state for real friends + requests
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [todaySteps, setTodaySteps] = useState(0); // placeholder for now

  const loadProfile = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoadingProfile(false);
      return;
    }
    try {
      const data = await getUserProfile(user.uid);
      if (data) {
        setProfile(data as UserProfile);
        setTodaySteps((data as any).dailySteps || 0);
      }
    } catch (e) {
      console.log('Error loading profile:', e);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    // TODO: later, replace this with real step tracking
  }, [loadProfile]);

  // Real-time listeners for friends and friend requests
  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    // Friends subcollection listener
    const friendsRef = collection(db, 'users', uid, 'friends');
    const unsubFriends = onSnapshot(friendsRef, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFriendsList(items as any[]);
    });

    // Friend requests (incoming)
    const requestsRef = collection(db, 'friendRequests');
    const incomingQ = query(requestsRef, where('to', '==', uid), where('status', '==', 'pending'));
    const unsubIncoming = onSnapshot(incomingQ, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      (async () => {
        const resolved = await Promise.all(items.map(async (it: any) => {
          const p = await getUserProfile(it.from);
          return { ...it, fromUsername: p?.username || it.from };
        }));
        setIncomingRequests(resolved);
      })();
    });

    // Friend requests (outgoing)
    const outgoingQ = query(requestsRef, where('from', '==', uid), where('status', '==', 'pending'));
    const unsubOutgoing = onSnapshot(outgoingQ, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      (async () => {
        const resolved = await Promise.all(items.map(async (it: any) => {
          const p = await getUserProfile(it.to);
          return { ...it, toUsername: p?.username || it.to };
        }));
        setOutgoingRequests(resolved);
      })();
    });

    return () => {
      try { unsubFriends(); } catch (e) {}
      try { unsubIncoming(); } catch (e) {}
      try { unsubOutgoing(); } catch (e) {}
    };
  }, []);

  // If profile exists and username is missing, prompt user to set one
  useEffect(() => {
    if (profile && !((profile as any).username)) {
      setUsernameModalVisible(true);
    }
  }, [profile]);

  // NOTE: Real-time listeners above keep `friendsList`, `incomingRequests`, and `outgoingRequests` up to date

  // Reload profile when screen comes into focus (to sync coins)
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const petName = profile?.petName ?? 'Sunny';
  const petLevel = profile?.petLevel ?? 1;
  const coins = profile?.coins ?? 0;

  const progress = Math.min(todaySteps / DAILY_GOAL, 1);
  const progressPercent = Math.round(progress * 100);

  return (
    <>
    <StepTracker
      onStep={() => {
        setTodaySteps(todaySteps + 1); // update UI immediately
        const user = auth.currentUser;
        if (user) {
          // Add 1 step to both dailySteps and totalSteps atomically
          updateDailySteps(user.uid, 1).catch(e =>
            console.log("Error updating steps:", e)
          );
        }
      }}
    />

    <ImageBackground
      source={require('../../assets/images/bg-2.png')}
      style={styles.background}
      resizeMode="cover"
    >
    <View style={styles.container}>
      {/* Top bar with coins */}
      <View style={styles.topBar}>
        <View style={styles.coinsPill}>
          <Image
            source={require('../../assets/images/coin.png')}
            style={styles.coinImage}
          />
          <Text style={styles.coinsText}>{coins}</Text>
        </View>
        <TouchableOpacity
          style={styles.friendsButton}
          onPress={() => setFriendsModalVisible(true)}
        >
          <Image
            source={require('../../assets/images/friends-button.png')}
            style={styles.friendsButtonImage}
          />
</TouchableOpacity>
      </View>

      {/* Daily challenge */}
      <View style={styles.section}>
        <Image
          source={require('../../assets/images/challenge-title.png')}
          style={styles.challengeTitleImage}
        />
        <View style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>Walk 3,000 steps</Text>
          <Text style={styles.challengeText}>
            Complete today&apos;s walk to earn bonus coins for your amiGO.
          </Text>
          <Text style={styles.challengeReward}>Reward: +50 coins</Text>
        </View>
        <View style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>Feed your pet</Text>
          <Text style={styles.challengeText}>
            Keep your AmiGO happy and healthy by feeding them treats.
          </Text>
          <Text style={styles.challengeReward}>Reward: +20 coins</Text>
        </View>
        <View style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>Roll on the gacha</Text>
          <Text style={styles.challengeText}>
            Roll for an item for your AmiGO!
          </Text>
          <Text style={styles.challengeReward}>Reward: +10 coins</Text>
        </View>
      </View>

      {/* Steps + progress */}
      <View style={styles.section}>
        <Image
          source={require('../../assets/images/steps-title.png')}
          style={styles.stepsTitleImage}
        />

        <View style={styles.stepsRow}>
          <Text style={styles.stepsNumber}>{todaySteps}</Text>
          <Text style={styles.stepsGoal}>/ {DAILY_GOAL}</Text>
          <TouchableOpacity
            style={styles.incrementButton}
            onPress={() => setTodaySteps(todaySteps + 100)}
          >
            <Text style={styles.incrementButtonText}>+100</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>

        <Text style={styles.progressLabel}>
          {progressPercent}% of your daily goal
        </Text>
      </View>
    </View>

    {/* Pet greeting */}
    <View style={styles.petSection}>
      <View style={styles.petCard}>
        <View style={styles.petCircle}>
          <LottieView
            source={require('../../assets/lottie/racoonwalk.json')}
            autoPlay
            loop
            style={{ width: 300, height: 200 }}
          />
        </View>
      </View>
    </View>
    
    {/* Friends Modal */}
    {/* Username setup modal (prompt if user has no username) */}
    <Modal
      visible={usernameModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setUsernameModalVisible(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Choose a username</Text>
          <TextInput
            value={newUsername}
            onChangeText={setNewUsername}
            placeholder="username"
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            autoCapitalize="none"
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <TouchableOpacity
              style={styles.smallButtonOutline}
              onPress={() => setUsernameModalVisible(false)}
            >
              <Text style={styles.smallButtonOutlineText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={async () => {
                const user = auth.currentUser;
                if (!user) return;
                if (!newUsername.trim()) return Alert.alert('Enter a username');
                const res = await setUsername(user.uid, newUsername.trim());
                if (!res.success) {
                  if (res.error === 'taken') {
                    Alert.alert('That username is already taken');
                  } else {
                    Alert.alert('Unable to set username');
                  }
                  return;
                }
                // Refresh profile
                const p = await getUserProfile(user.uid);
                setProfile(p as any);
                setUsernameModalVisible(false);
              }}
            >
              <Text style={styles.smallButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    <Modal
      visible={friendsModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setFriendsModalVisible(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Friends</Text>
          {/* Search / Send Friend Request */}
          <View style={{ marginBottom: 12 }}>
            <TextInput
              value={searchUsername}
              onChangeText={setSearchUsername}
              placeholder="Enter a username"
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              autoCapitalize="none"
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={async () => {
                  if (!searchUsername.trim()) return Alert.alert('Enter a username');
                  const result = await getUserByUsername(searchUsername.trim());
                  if (!result) {
                    setSearchResult(null);
                    return Alert.alert('We couldn\'t find that user. Invite them to AmiGOes!');
                  }
                  setSearchResult(result);
                }}
              >
                <Text style={styles.smallButtonText}>Search</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallButtonOutline}
                onPress={async () => {
                  const user = auth.currentUser;
                  if (!user) return Alert.alert('Not signed in');
                  const username = searchUsername.trim();
                  if (!username) return Alert.alert('Enter a username');
                  const res = await sendFriendRequest(user.uid, username);
                  if (!res.success) {
                    if (res.error === 'not-found') {
                      Alert.alert('We couldn\'t find that user. Invite them to AmiGOes!');
                    } else if (res.error === 'self') {
                      Alert.alert('You cannot friend yourself');
                    } else if (res.error === 'already-friends') {
                      Alert.alert('Already friends');
                    } else if (res.error === 'request-exists') {
                      Alert.alert('A pending request already exists');
                    } else {
                      Alert.alert('Error sending request');
                    }
                    return;
                  }
                  Alert.alert('Friend request sent');
                }}
              >
                <Text style={styles.smallButtonOutlineText}>Send Request</Text>
              </TouchableOpacity>
            </View>

            {searchResult ? (
              <View style={[styles.friendCard, { marginTop: 8 }]}> 
                <View style={styles.friendInfo}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>{(searchResult.username || 'U').charAt(0)}</Text>
                  </View>
                  <View style={styles.friendText}>
                    <Text style={styles.friendName}>{searchResult.username}</Text>
                    <Text style={styles.friendLevel}>{searchResult.email || ''}</Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          {/* Incoming requests */}
          <Text style={[styles.modalTitle, { marginTop: 6, marginBottom: 6 }]}>Incoming</Text>
          <FlatList
            data={incomingRequests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.friendCard}>
                <View style={styles.friendInfo}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>{((item.fromUsername || item.from) || '').charAt(0)}</Text>
                  </View>
                  <View style={styles.friendText}>
                    <Text style={styles.friendName}>Friend request from: {item.fromUsername || item.from || 'Unknown'}</Text>
                    <Text style={styles.friendLevel}>Incoming request</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={styles.smallButton}
                    onPress={async () => {
                      const user = auth.currentUser;
                      if (!user) return;
                      const res = await acceptFriendRequest(item.id, user.uid);
                      if (res.success) {
                        Alert.alert('Friend added');
                      } else {
                        Alert.alert('Unable to accept');
                      }
                    }}
                  >
                    <Text style={styles.smallButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.smallButtonOutline}
                    onPress={async () => {
                      const user = auth.currentUser;
                      if (!user) return;
                      const res = await declineFriendRequest(item.id, user.uid);
                      if (res.success) {
                        Alert.alert('Request declined');
                      } else {
                        Alert.alert('Unable to decline');
                      }
                    }}
                  >
                    <Text style={styles.smallButtonOutlineText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          {/* Outgoing requests */}
          <Text style={[styles.modalTitle, { marginTop: 6, marginBottom: 6 }]}>Outgoing</Text>
          <FlatList
            data={outgoingRequests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.friendCard}>
                <View style={styles.friendInfo}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>{((item.toUsername || item.to) || '').charAt(0)}</Text>
                  </View>
                  <View style={styles.friendText}>
                    <Text style={styles.friendName}>{item.toUsername || item.to || 'Unknown'}</Text>
                    <Text style={styles.friendLevel}>Pending request</Text>
                  </View>
                </View>
              </View>
            )}
          />

          {/* Friends list */}
          <Text style={[styles.modalTitle, { marginTop: 6, marginBottom: 6 }]}>Friends</Text>
          <FlatList
            data={friendsList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setFriendsModalVisible(false);
                  router.push({
                    pathname: '/friend-profile',
                    params: {
                      id: item.uid || item.id,
                      name: item.username || item.uid,
                      level: 1,
                      status: 'Friend',
                    },
                  });
                }}
              >
                <View style={styles.friendCard}>
                  <View style={styles.friendInfo}>
                    <View style={styles.friendAvatar}>
                      <Text style={styles.friendAvatarText}>{(item.username || item.uid || 'U').charAt(0)}</Text>
                    </View>
                    <View style={styles.friendText}>
                      <Text style={styles.friendName}>{item.username || item.uid}</Text>
                      <Text style={styles.friendLevel}>Friend</Text>
                    </View>
                  </View>
                  <Text style={styles.friendStatus}>{item.email || ''}</Text>
                </View>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setFriendsModalVisible(false)}
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 15,
    marginBottom: 5,
  },
  coinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffffff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 0,
    borderColor: '#1f2937',
    width: 100,
    marginTop: 2,
  },
  coinsText: {
    color: '#facc15',
    fontWeight: '700',
    fontSize: 15,
    paddingLeft: 5,
  },
  petSection: {
    alignItems: 'center', 
    marginBottom: 24,
  },
  petCard: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  petCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  petEmoji: {
    fontSize: 60,
  },
  petGreeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  petSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#485161ff',
    marginBottom: 8,
  },
  challengeCard: {
    backgroundColor: '#afa8cbff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#1f2937',
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#514971ff',
    marginBottom: 5,
  },
  challengeText: {
    fontSize: 13,
    color: '#ffffffff',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
    gap: 8,
  },
  stepsNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffffff',
  },
  stepsGoal: {
    fontSize: 16,
    color: '#ffffffff',
    marginLeft: 4,
    marginBottom: 2,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffffff',
  },
  progressLabel: {
    marginTop: 6,
    fontSize: 15,
    color: '#ffffffff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 7, 7, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#facc15',
    marginBottom: 12,
  },
  friendCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#071028',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#111827',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    color: '#e5e7eb',
    fontWeight: '700',
  },
  friendText: {
    flexDirection: 'column',
  },
  friendName: {
    color: '#e5e7eb',
    fontWeight: '600',
  },
  friendStatus: {
    color: '#9ca3af',
  },
  modalClose: {
    marginTop: 12,
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#022c22',
    fontWeight: '700',
  },
  friendLevel: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  background: {
    flex: 1,
  },
  coinImage: {
    width: 30,
    height: 30,
    transform: [{ translateX: -5 }],
  },
  friendsButtonImage: {
    width: 210,                
    height: 100,
    resizeMode: 'contain',
    marginTop: 28,
    marginLeft: 190,    
  },
  friendsButton: {
    width: 80,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeTitleImage: {
    width: 300,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 2,
  },
  stepsTitleImage: {
    width: 230,
    height: 60,
    resizeMode: 'contain',
  },
  incrementButton: {
    backgroundColor: '#22c55e',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 'auto',
    alignSelf: 'center',
  },
  incrementButtonText: {
    color: '#022c22',
    fontWeight: '700',
    fontSize: 14,
  },
  challengeReward: {
    fontSize: 13,
    color: '#facc15',
    fontWeight: '700',
    marginTop: 6,
  },
  searchInput: {
    backgroundColor: '#071028',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#111827',
  },
  smallButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: {
    color: '#022c22',
    fontWeight: '700',
  },
  smallButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#facc15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonOutlineText: {
    color: '#facc15',
    fontWeight: '700',
  },

});
