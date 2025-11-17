import { useEffect, useState } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getInventory, InventoryItem, subscribe } from '../inventoryService';

export default function PetScreen() {
  const TOTAL_SLOTS = 12;
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [equippedItem, setEquippedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const items = await getInventory();
      setInventory(items);
      unsub = subscribe((items) => setInventory(items));
    })();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // build slots array of length TOTAL_SLOTS where each element is the inventory item or null
  const slots = Array.from({ length: TOTAL_SLOTS }).map((_, i) => ({
    slotIndex: i,
    item: inventory[i] ?? null,
  }));

  // Map inventory item to avatar image
  const getAvatarImage = (item: InventoryItem | null) => {
    if (!item) {
      return require('../../assets/images/avatar/nothing-on.png');
    }

    // Check by name first
    const name = item.name.toLowerCase();
    if (name.includes('67') || name.includes('67-shirt')) {
      return require('../../assets/images/avatar/67-on.png');
    }
    if (name.includes('cloudy') || name.includes('cloudy-shirt')) {
      return require('../../assets/images/avatar/cloudy-on.png');
    }
    if (name.includes('sunny') || name.includes('sunny-shirt')) {
      return require('../../assets/images/avatar/sunny-on.png');
    }

    // Check by image path if available (fallback)
    // For now, default to nothing-on if we can't match
    return require('../../assets/images/avatar/nothing-on.png');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Your AmiGO</Text>

        <View style={styles.petCard}>
          {/* Placeholder pet – you can replace this with a real image later */}
          <View style={styles.petCircle}>
            <Image 
            source={getAvatarImage(equippedItem)} 
            style={styles.petImage} 
            resizeMode="contain"
            />
          </View>

          <Text style={styles.petName}>Sunny</Text>
          <Text style={styles.petLevel}>Level 1 · Mood: Chill</Text>
        </View>

        <FlatList
          data={slots}
          keyExtractor={(it) => String(it.slotIndex)}
          numColumns={3}
          style={styles.grid}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.itemBox,
                selectedSlot === item.slotIndex && styles.itemBoxSelected,
              ]}
              onPress={() => {
                if (selectedSlot === item.slotIndex) {
                  // Deselect and unequip
                  setSelectedSlot(null);
                  setEquippedItem(null);
                } else {
                  // Select and equip the item
                  setSelectedSlot(item.slotIndex);
                  if (item.item) {
                    setEquippedItem(item.item);
                  }
                }
              }}
            >
              {item.item ? (
                item.item.emoji ? (
                  <Text style={styles.itemEmoji}>{item.item.emoji}</Text>
                ) : item.item.image ? (
                  <Image
                    source={item.item.image}
                    style={styles.itemImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.itemName}>{item.item.name}</Text>
                )
              ) : null}
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
    marginBottom: 10,
    textAlign: 'center',
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
  petImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
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
  itemBoxSelected: {
    backgroundColor: '#0a0f1a',
    borderColor: '#3f4652',
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
  itemEmoji: {
    fontSize: 32,
  },
  itemName: {
    color: '#e5e7eb',
    fontSize: 12,
    textAlign: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
  },
  itemImagePlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: '#111827',
    borderRadius: 8,
  },
  emptyText: {
    color: '#9ca3af',
  },
});
