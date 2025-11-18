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
    if (name.includes('cowboy hat') || name.includes('cowboy-hat')) {
      return require('../../assets/images/avatar/cowboy-on.png');
    }
    if (name.includes('overalls')) {
      return require('../../assets/images/avatar/overalls-on.png');
    }
    if (name.includes('cowboy2') || name.includes('cowboy 2')) {
      return require('../../assets/images/avatar/cowboy2-on.png');
    }
    if (name.includes('straw hat') || name.includes('strawhat')) {
      return require('../../assets/images/avatar/strawhat-on.png');
    }
    if (name.includes('sombrero')) {
      return require('../../assets/images/avatar/sombrero-on.png');
    }
    if (name.includes('blackhoodie') || name.includes('black hoodie') || name.includes('hoodie')) {
      return require('../../assets/images/avatar/hoodie-on.png');
    }
    if (name.includes('pink cowboy') || name.includes('pink-cowboy')) {
      return require('../../assets/images/avatar/pink-cowboy-on.png');
    }
    if (name.includes('maid') || name.includes('maid outfit')) {
      return require('../../assets/images/avatar/maid-outfit-on.png');
    }

    // Check by image path if available (fallback)
    // For now, default to nothing-on if we can't match
    return require('../../assets/images/avatar/nothing-on.png');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require('../../assets/images/inventory-title.png')}
          style={styles.titleImage}
        />

        <View style={styles.inventoryCard}>
          <Image
            source={require('../../assets/images/inventory-bg.png')}
            style={styles.inventoryBgImage}
            resizeMode="contain"
          />

          {/* Pet avatar on top of inventory background */}
          <View style={styles.petContent}>
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
    backgroundColor: '#F3E9DB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F3E9DB',
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
    color: '#445066ff',
    marginBottom: 24,
  },
  petCard: {
    backgroundColor: 'rgba(162, 175, 207, 1)',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  petCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'transparent',
    justifyContent: 'center',   // 👈 add
    alignItems: 'center',        // 👈 add
    alignSelf: 'center',         // 👈 add this to center the whole circle
    marginBottom: 1,
  },
  petImage: {
    width: '180%',
    height: undefined,
    aspectRatio: 250 / 220,
    marginTop: 30,      // px is stable across devices
  },
  petName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000ff',
  },
  petLevel: {
    fontSize: 13,
    color: '#000000ff',
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
    backgroundColor: '#e3d2baff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#5d5141ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBoxSelected: {
    backgroundColor: '#eecfa3ff',
    borderColor: '#666564ff',
    borderWidth: 3,
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
  inventoryBgImage: {
    width: '100%',          // fill parent width
    height: undefined,      // let aspect ratio control height
    aspectRatio: 400 / 370, // match your original image’s proportions
    position: 'absolute',
    top: 10,                 // make it stay behind the pet
    alignSelf: 'center',    // center horizontally
  },
  inventoryCard: {
    alignItems: 'center',
    justifyContent: 'flex-start', // <-- align from top
    width: '100%',
    paddingVertical: 20,
    marginBottom: 5,
    position: 'relative',   // for absolute children
    aspectRatio: 400 / 370, // same as your inventory image
  },
  petContent: {
    position: 'absolute',   // position on top of background
    top: '35%',             // adjust this % to center vertically on the background
    width: '100%',
    alignItems: 'center',
  },
  titleImage: {
    width: 230,
    height: 60,
    alignSelf: 'center',
    resizeMode: 'contain',
  },
});
