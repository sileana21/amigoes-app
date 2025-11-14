import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>AmiGOes 🐾</Text>
      <Text style={styles.subtitle}>
        Your walking buddy and fitness coach.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today&apos;s Steps</Text>
        <Text style={styles.steps}>0 / 5,000</Text>
        <Text style={styles.cardText}>
          Take a short walk today to earn rewards for your pet!
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => {}}>
          <Text style={styles.buttonText}>Start Walking</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>Pet</Text>
          <Text style={styles.badgeValue}>Level 1</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>Coins</Text>
          <Text style={styles.badgeValue}>0</Text>
        </View>
      </View>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#facc15',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#e5e7eb',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 20,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  steps: {
    fontSize: 28,
    fontWeight: '800',
    color: '#22c55e',
  },
  cardText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: {
    color: '#022c22',
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  badge: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  badgeLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  badgeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
  },
});

