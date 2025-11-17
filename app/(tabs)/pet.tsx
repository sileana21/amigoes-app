import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PetScreen() {
  const ITEMS = Array.from({ length: 12 }).map((_, i) => ({ id: String(i + 1) }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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

        <FlatList
          data={ITEMS}
          keyExtractor={(it) => it.id}
          numColumns={3}
          style={styles.grid}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.itemBox} onPress={() => { /* open item slot */ }}>
            </TouchableOpacity>
          )}
        />
      </View>
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
  width: 180,
  height: 180,
  borderRadius: 90,
  backgroundColor: '#111827',
  justifyContent: 'center',   // 👈 add
  alignItems: 'center',        // 👈 add
  alignSelf: 'center',         // 👈 add this to center the whole circle
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
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  grid: {
    flex: 1,
    marginTop: 20,
  },
  gridContent: {
    paddingBottom: 24,
  },
  itemBox: {
    flex: 1,
    margin: 6,
    aspectRatio: 1, // square
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
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
