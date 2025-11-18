import { useFocusEffect } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import { addItem, getInventory } from '../inventoryService';
import { updateCoins } from '../userProfileService';

interface GachaItem {
  id: number;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  probability: number;
  image?: any;
}

const GACHA_ITEMS: GachaItem[] = [
  { id: 1, name: 'Straw Hat', rarity: 'common', probability: 70, image: require('../../assets/images/accessory/strawhat.png') },
  { id: 2, name: 'Sombrero', rarity: 'common', probability: 70, image: require('../../assets/images/accessory/sombrero.png') },
  { id: 3, name: 'Black Hoodie', rarity: 'rare', probability: 25, image: require('../../assets/images/accessory/hoodie-on.png') },
  { id: 4, name: 'Pink Cowboy Hat', rarity: 'epic', probability: 5, image: require('../../assets/images/accessory/pink-cowboy.png') },
  { id: 5, name: 'Maid Outfit', rarity: 'legendary', probability: 1, image: require('../../assets/images/accessory/maid-outfit.png') },
];

const SHOP_ITEMS = [
  { id: 101, name: "67-Shirt", price: 670, image: require('../../assets/images/accessory/67-shirt.png') },
  { id: 102, name: "Cowboy Hat", price: 100, image: require('../../assets/images/accessory/cowboy-hat-2.png') },
  { id: 103, name: "Sunny-Shirt", price: 100, image: require('../../assets/images/accessory/sunny-shirt.png') },
  { id: 104, name: "Overalls", price: 250, image: require('../../assets/images/accessory/overall-2.png') },
  { id: 105, name: "Cloudy-Shirt", price: 100, image: require('../../assets/images/accessory/cloudy-shirt.png') },
  { id: 106, name: "Cowboy2", price: 200, image: require('../../assets/images/accessory/cowboy2-2.png') },
];

const RARITY_COLORS = {
  common: '#6b7280',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#fbbf24',
};

export default function ShopScreen() {
  const [coins, setCoins] = useState(0);
  const [loadingCoins, setLoadingCoins] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [resultItem, setResultItem] = useState<GachaItem | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<Set<number>>(new Set());
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Load coins from Firebase
  const loadCoins = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoadingCoins(false);
      return;
    }

    try {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setCoins(data.coins ?? 0);
      }
    } catch (e) {
      console.log('Error loading coins:', e);
    } finally {
      setLoadingCoins(false);
    }
  }, []);

  useEffect(() => {
    loadCoins();
  }, [loadCoins]);

  // Reload coins when screen comes into focus (to sync with home screen)
  useFocusEffect(
    useCallback(() => {
      loadCoins();
    }, [loadCoins])
  );

  const getRandomItem = (): GachaItem => {
    const totalProbability = GACHA_ITEMS.reduce((sum, item) => sum + item.probability, 0);
    let random = Math.random() * totalProbability;
    
    for (const item of GACHA_ITEMS) {
      random -= item.probability;
      if (random <= 0) return item;
    }
    return GACHA_ITEMS[0];
  };

  const buyItem = async (item: any) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to purchase items!");
      return;
    }

    if (coins < item.price) {
      alert("Not enough coins!");
      return;
    }

    const newCoins = coins - item.price;
    setCoins(newCoins);
    setPurchasedItems(new Set([...purchasedItems, item.id]));

    // Update coins in Firebase
    try {
      await updateCoins(user.uid, newCoins);
    } catch (e) {
      console.warn('Failed to update coins:', e);
    }

    // add to shared inventory (image or name will be stored)
    try {
      await addItem({
        id: `${Date.now()}-${item.id}`,
        name: item.name,
        image: item.image,
        sourceId: item.id,
      });
    } catch (e) {
      console.warn('Failed to add item to inventory', e);
    }

    alert(`You bought: ${item.name}!`);
  };

  const handlePull = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to use the gacha!");
      return;
    }

    if (coins < 100) return;
    
    setPulling(true);
    const newCoins = coins - 100;
    setCoins(newCoins);

    // Update coins in Firebase
    try {
      await updateCoins(user.uid, newCoins);
    } catch (e) {
      console.warn('Failed to update coins:', e);
    }

    // Animate spinning
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ).start();

    // Simulate pull duration
    setTimeout(async () => {
      const item = getRandomItem();
      setResultItem(item);
      setShowResult(true);
      setPulling(false);
      spinAnim.setValue(0);

      // Check if item already exists in inventory before adding
      try {
        const currentInventory = await getInventory();
        const itemExists = currentInventory.some(
          (inventoryItem) => 
            inventoryItem.name === item.name || 
            (inventoryItem.sourceId && inventoryItem.sourceId === item.id)
        );

        if (!itemExists) {
          // add gacha result to inventory only if it doesn't exist
          await addItem({
            id: `${Date.now()}-gacha-${item.id}`,
            name: item.name,
            image: item.image,
            rarity: item.rarity,
            sourceId: item.id,
          });
        }
      } catch (e) {
        console.warn('Failed to check/add gacha item to inventory', e);
      }
    }, 2000);
  };

  return (
    <ImageBackground
          source={require('../../assets/images/bg.png')}
          style={styles.background}
          resizeMode="cover"
        >

      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollContent}>
          <Text style={styles.title}>Your Coins</Text>
          <View style={styles.coinRow}>
            <Image
              source={require('../../assets/images/coin.png')}
              style={styles.coinImage}
            />
            <Text style={styles.coinAmount}>{coins}</Text>
          </View>


          <View style={styles.shopContainer}>
            <Image
              source={require('../../assets/images/shop.png')}
              style={styles.shopImage}
            />

            {SHOP_ITEMS.map((item, index) => {
              const isPurchased = purchasedItems.has(item.id);
              // Calculate position for grid layout (3 items per row)
              const row = Math.floor(index / 3);
              const col = index % 3;
              const baseTop = 110;
              const baseLeft = 65;
              const rowHeight = 125;
              const colWidth = 108;
              
              const itemStyle = {
                ...styles.itemWrapper,
                top: baseTop + (row * rowHeight),
                left: baseLeft + (col * colWidth),
              };
              
              return (
                <View key={item.id} style={itemStyle}>
                  {/* Price */}
                  <Text style={styles.itemPrice}>{item.price} coins</Text>

                  <Image
                    source={item.image}
                    style={styles.slotItem}
                    resizeMode="contain"
                  />

                  <TouchableOpacity
                    style={[
                      styles.buyButton,
                      isPurchased && styles.buyButtonDisabled,
                    ]}
                    onPress={() => !isPurchased && buyItem(item)}
                    disabled={isPurchased}
                  >
                    {!isPurchased ? (
                      <Image
                        source={require('../../assets/images/buy-button.png')}
                        style={styles.buyButtonImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.purchasedText}>Purchased</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <Image
              source={require('../../assets/images/gacha-title.png')}
              style={styles.gachaTitle}
              resizeMode="contain"
            />
          <Image
            source={require('../../assets/images/limited-image.png')}
            style={styles.limitedBanner}
            resizeMode="contain"
          />
          {/* Gacha Pull Section */}
          {/* Rarity Info */}
          <View style={styles.gachaContainer}>
            <Text style={styles.gachaSubtitle}>
              Spend 100 coins per pull to get a random item from the shop. Each item has a rarity and a chance of appearing:
            </Text>
            <View style={styles.rarityInfo}>
              <View style={styles.rarityRow}>
                <Text style={[styles.rarityLabel, { color: 'white' }]}>🔴 Common - 70%</Text>
                <Text style={[styles.rarityLabel, { color: 'white' }]}>🔵 Rare - 25%</Text>
              </View>
              <View style={styles.rarityRow}>
                <Text style={[styles.rarityLabel, { color: 'white' }]}>🟣 Epic - 5%</Text>
                <Text style={[styles.rarityLabel, { color: 'white' }]}>🟡 Legendary - 1%</Text>
            </View>
          </View>

          {/* Current Coins */}
          <Text style={styles.title}>Your Coins</Text>
          <Text style={styles.coinAmount}>{coins}</Text>

          {/* Pull Button */}
            <TouchableOpacity
              style={[
                styles.pullButton,
                { opacity: coins < 100 || pulling ? 0.5 : 1 },
              ]}
              onPress={handlePull}
              disabled={coins < 100 || pulling}
            >
              <Text style={styles.pullButtonText}>
                {pulling ? 'Pulling...' : 'PULL (100 coins)'}
              </Text>
            </TouchableOpacity>
          </View>
            
          <Image
            source={require('../../assets/images/other-items.png')}
            style={styles.otherItems}
            resizeMode="contain"
          />
          
        </ScrollView>

        {/* Result Modal */}
        <Modal visible={showResult} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.resultCard,
                {
                  borderColor: resultItem ? RARITY_COLORS[resultItem.rarity] : '#fff',
                },
              ]}
            >
              <Text style={styles.resultTitle}>You Got...</Text>
              {resultItem?.image && (
                <Image
                  source={resultItem.image}
                  style={styles.resultImage}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.resultName}>{resultItem?.name}</Text>
              <Text
                style={[
                  styles.resultRarity,
                  { color: resultItem ? RARITY_COLORS[resultItem.rarity] : '#fff' },
                ]}
              >
                 {resultItem?.rarity.toUpperCase()} 
              </Text>

              <TouchableOpacity
                style={styles.okButton}
                onPress={() => setShowResult(false)}
              >
                <Text style={styles.okButtonText}>Claim</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  shopImage: {
    width: 430,
    height: 390,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffffff',
    marginBottom: 10,
  },
  coinAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffffff',
  },
  gachaContainer: {
    backgroundColor: '#dd90afff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 2,
    borderWidth: 3,
    borderColor: '#ffffffff',
  },
  rarityInfo: {
    marginBottom: 16,
  },
  rarityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rarityLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  pullButton: {
    backgroundColor: '#ffffffff',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 12,
  },
  pullButtonText: {
    color: '#022c22',
    fontWeight: '700',
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#facc15',
    marginBottom: 12,
  },
  resultImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  resultName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  resultRarity: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 20,
  },
  okButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
  },
  okButtonText: {
    color: '#022c22',
    fontWeight: '700',
    fontSize: 16,
  },
  coinImage: {
    width: 50,
    height: 50,
  },
  coinTitle: {
    width: 150,
    height: 20,
    resizeMode: 'contain',    
    marginBottom: 10,  
  },
  coinRow: {
    flexDirection: 'row',        
    alignItems: 'center',      
    justifyContent: 'flex-start', 
    gap: 8,                     
  },
  shopItemImage: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 20,
  },
  shopContainer: {
    width: 450,
    height: 400,
    alignSelf: 'center',
    position: 'relative', 
  },
  slotItem: {
    width: 85,
    height: 70,
  },
  buyButtonImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  buyButton: {
    width: 80,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  buyButtonImageDisabled: {
    opacity: 0.5,
  },
  purchasedText: {
    position: 'absolute',
    color: '#ffffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  itemWrapper: {
    position: 'absolute',
    top: 110,   
    left: 65,  
    width: 120,
    height: 160,
    alignItems: 'center',
  },
  gachaSubtitle: {
    fontSize: 13,
    color: '#ffffffff',
    marginBottom: 24,
  },
  itemPrice: {
    color: '#ffffffff',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10
  },
  limitedBanner: {
    width: '100%',
    height: 200,           
    resizeMode: 'cover',  
    marginBottom: 12,  
  },
  gachaTitle: {
    width: '100%',
    height: 80,         
    resizeMode: 'cover',  
  },
  otherItems: {
    width: '100%',
    height: 400,           
    resizeMode: 'cover',  
    marginBottom: 12,  
  },
});