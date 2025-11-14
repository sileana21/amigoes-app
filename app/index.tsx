import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>AmiGOes 🐾</Text>
      <Text style={styles.tagline}>Walk more. Level up your pet.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome!</Text>
        <Text style={styles.cardText}>
          AmiGOes is your walking buddy. Earn coins, keep your pet happy, and
          challenge your friends to move more.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.primaryText}>Continue as Guest</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.secondaryText}>Log in / Sign up</Text>
        </TouchableOpacity>
      </View>
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
  tagline: {
    fontSize: 14,
    color: '#e5e7eb',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  cardText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryText: {
    color: '#022c22',
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  secondaryText: {
    color: '#e5e7eb',
    fontWeight: '600',
  },
});
