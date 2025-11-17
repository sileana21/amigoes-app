import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PetScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
      <Text style={styles.title}>Your AmiGO</Text>
      <Text style={styles.subtitle}>Take walks to keep your pet happy!</Text>

      <View style={styles.petCard}>
        {/* Placeholder pet – you can replace this with a real image later */}
        <View style={styles.petCircle}>
          <Text style={styles.petEmoji}>🐾</Text>
        </View>

        <Text style={styles.petName}>Sunny</Text>
        <Text style={styles.petLevel}>Level 1 · Mood: Chill</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Today&apos;s Steps</Text>
          <Text style={styles.statValue}>0</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Coins</Text>
          <Text style={styles.statValue}>0</Text>
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#facc15',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#e5e7eb',
    marginBottom: 24,
  },
  petCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
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
    fontSize: 48,
  },
  petName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  petLevel: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
  },
});
