import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

type UserProfile = {
  email?: string;
  coins: number;
  petName: string;
  petLevel: number;
};

const DAILY_GOAL = 10000; // you can change this later

export default function HomeScreen() {
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
    setTodaySteps(1200);
  }, []);

  const petName = profile?.petName ?? 'Sunny';
  const petLevel = profile?.petLevel ?? 1;
  const coins = profile?.coins ?? 0;

  const progress = Math.min(todaySteps / DAILY_GOAL, 1);
  const progressPercent = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      {/* Top bar with coins */}
      <View style={styles.topBar}>
        <View style={styles.coinsPill}>
          <Text style={styles.coinEmoji}>🪙</Text>
          <Text style={styles.coinsText}>{coins}</Text>
        </View>
      </View>

      {/* Pet greeting */}
      <View style={styles.petCard}>
        <View style={styles.petCircle}>
          {/* 🦝 placeholder – later you can animate this */}
          <Text style={styles.petEmoji}>🦝</Text>
        </View>
        <Text style={styles.petGreeting}>
          Hey, I&apos;m {petName}! 👋
        </Text>
        <Text style={styles.petSubtitle}>
          Level {petLevel} · I&apos;m ready to walk with you today.
        </Text>
      </View>

      {/* Daily challenge */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today&apos;s Challenge</Text>
        <View style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>Walk 3,000 steps</Text>
          <Text style={styles.challengeText}>
            Complete today&apos;s walk to earn bonus coins for your AmiGO.
          </Text>
        </View>
      </View>

      {/* Steps + progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today&apos;s Steps</Text>

        <View style={styles.stepsRow}>
          <Text style={styles.stepsNumber}>{todaySteps}</Text>
          <Text style={styles.stepsGoal}>/ {DAILY_GOAL}</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  coinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  coinEmoji: {
    fontSize: 18,
    marginRight: 4,
  },
  coinsText: {
    color: '#facc15',
    fontWeight: '700',
    fontSize: 16,
  },
  petCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  petCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#111827',
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  challengeCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#facc15',
    marginBottom: 4,
  },
  challengeText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  stepsNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#22c55e',
  },
  stepsGoal: {
    fontSize: 16,
    color: '#9ca3af',
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
    backgroundColor: '#22c55e',
  },
  progressLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#9ca3af',
  },
});
