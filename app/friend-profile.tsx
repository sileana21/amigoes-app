import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FriendProfileScreen() {
  const router = useRouter();
  const { id, name, level, status } = useLocalSearchParams<{
    id: string;
    name: string;
    level: string;
    status: string;
  }>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Friend card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{name?.charAt(0)}</Text>
          </View>
          <Text style={styles.friendName}>{name}</Text>
          <Text style={styles.friendStatus}>
            Status: {status === 'Online' ? '🟢' : '🔴'} {status}
          </Text>
          <Text style={styles.friendLevel}>Level {level}</Text>
        </View>

        {/* Stats section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Coins</Text>
              <Text style={styles.statValue}>1,250</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Steps Today</Text>
              <Text style={styles.statValue}>8,432</Text>
            </View>
          </View>
        </View>

        {/* Pet section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pet</Text>
          <View style={styles.petBox}>
            <Text style={styles.petEmoji}>🦊</Text>
            <View>
              <Text style={styles.petName}>Rusty</Text>
              <Text style={styles.petLevel}>Level 7</Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.messageButton}>
            <Text style={styles.messageText}>Message</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButtonText: {
    color: '#facc15',
    fontWeight: '600',
    fontSize: 16,
  },
  profileCard: {
    marginHorizontal: 24,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 48,
    color: '#e5e7eb',
    fontWeight: '700',
  },
  friendName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  friendStatus: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  friendLevel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#facc15',
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22c55e',
  },
  petBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  petEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  petName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  petLevel: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 40,
  },
  addFriendButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addFriendText: {
    color: '#022c22',
    fontWeight: '700',
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  messageText: {
    color: '#e5e7eb',
    fontWeight: '700',
  },
});
