import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Image, ImageBackground, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig';
import StepTracker from "../stepCounter";


type UserProfile = {
  email?: string;
  coins: number;
  petName: string;
  petLevel: number;
};

const DAILY_GOAL = 10000; // you can change this later

export default function HomeScreen() {
  const router = useRouter();
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);

  const FRIENDS = [
    { id: '1', name: 'Alex', status: 'Online' , level: '5'},
    { id: '2', name: 'Jordan', status: 'Offline' , level: '3'},
    { id: '3', name: 'Casey', status: 'Online', level: '4' },
  ];

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [todaySteps, setTodaySteps] = useState(0); // placeholder for now

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        }
      } catch (e) {
        console.log('Error loading profile:', e);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();

    // TODO: later, replace this with real step tracking

  }, []);

  const petName = profile?.petName ?? 'Sunny';
  const petLevel = profile?.petLevel ?? 1;
  const coins = profile?.coins ?? 0;

  const progress = Math.min(todaySteps / DAILY_GOAL, 1);
  const progressPercent = Math.round(progress * 100);

  return (
    <>
    <StepTracker onStep={() => setTodaySteps(todaySteps + 1)} />

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
        </View>
        <View style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>Feed your pet</Text>
          <Text style={styles.challengeText}>
            Keep your AmiGO happy and healthy by feeding them treats.
          </Text>
        </View>
        <View style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>Roll on the gacha</Text>
          <Text style={styles.challengeText}>
            Roll for an item for your AmiGO!
          </Text>
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
    <Modal
      visible={friendsModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setFriendsModalVisible(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Friends</Text>
          <FlatList
            data={FRIENDS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setFriendsModalVisible(false);
                  router.push({
                    pathname: '/friend-profile',
                    params: {
                      id: item.id,
                      name: item.name,
                      level: item.level,
                      status: item.status,
                    },
                  });
                }}
              >
                <View style={styles.friendCard}>
                  <View style={styles.friendInfo}>
                    <View style={styles.friendAvatar}>
                      <Text style={styles.friendAvatarText}>{item.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.friendText}>
                      <Text style={styles.friendName}>{item.name}</Text>
                      <Text style={styles.friendLevel}>Level {item.level}</Text>
                    </View>
                  </View>
                  <Text style={styles.friendStatus}>{item.status}</Text>
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
    marginBottom: 16,
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
    fontSize: 25,
    paddingLeft: 20,
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
    marginBottom: 12,
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
    fontSize: 18,
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
});
