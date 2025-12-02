import { View, Text, FlatList, StyleSheet, SafeAreaView, ImageBackground } from 'react-native';
import { auth } from './firebaseConfig';
import { useEffect, useState } from 'react';
import { getUserProfile } from './userProfileService';

type Achievement = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
};

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const loadAchievements = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const profile = await getUserProfile(user.uid);

      const allAchievements: Achievement[] = [
        { id: '1', title: 'First 100 Steps', description: 'Take 100 steps in a day', completed: profile?.totalSteps >= 100 },
        { id: '2', title: 'Step Master', description: 'Reach 10,000 total steps', completed: profile?.totalSteps >= 10000 },
        { id: '3', title: 'Marathoner', description: 'Walk 42,195 steps', completed: profile?.totalSteps >= 42195 },
      ];

      setAchievements(allAchievements);
    };

    loadAchievements();
  }, []);

  return (
    <ImageBackground
      source={require('../assets/images/bg-3.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Achievements</Text>
        <FlatList
          data={achievements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.achievementCard, item.completed && styles.completedCard]}>
              <Text style={styles.achievementTitle}>{item.title}</Text>
              <Text style={styles.achievementDesc}>{item.description}</Text>
              {item.completed && <Text style={styles.completedLabel}>✓ Completed</Text>}
            </View>
          )}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  background: { flex: 1 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  achievementCard: {
    backgroundColor: '#62c1e5',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#126382',
  },
  completedCard: {
    backgroundColor: '#1c96c5',
    borderColor: '#FFD54F',
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  achievementDesc: {
    fontSize: 14,
    color: '#e5e7eb',
    marginTop: 4,
  },
  completedLabel: {
    fontSize: 12,
    color: '#FFD54F',
    marginTop: 8,
    fontWeight: '700',
  },
});
