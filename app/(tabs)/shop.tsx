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
import { addItem, getInventory, subscribe } from '../inventoryService';
import { updateCoins } from '../userProfileService';

export type GachaItem = {
  id: number;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  probability: number;
  image?: any;
}

export const GACHA_ITEMS: GachaItem[] = [
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
  const [singlePulling, setSinglePulling] = useState(false);
  const [tenPulling, setTenPulling] = useState(false);
  const [resultItem, setResultItem] = useState<GachaItem | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [ownedSourceIds, setOwnedSourceIds] = useState<Set<string>>(new Set());
  const [ratesModalVisible, setRatesModalVisible] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [resultItems, setResultItems] = useState<GachaItem[]>([]); // for multi-pull
  const [showMultiResult, setShowMultiResult] = useState(false);

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

  // Load owned inventory and subscribe to changes so we can disable buy buttons for owned items
  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const items = await getInventory();
        const ids = new Set(items.map(i => String(i.sourceId)));
        setOwnedSourceIds(ids);
      } catch (e) {
        console.warn('Failed to load inventory for ownership check', e);
      }

      try {
        unsub = subscribe((items) => {
          const ids = new Set(items.map(i => String(i.sourceId)));
          setOwnedSourceIds(ids);
        });
      } catch (e) {
        // ignore
      }
    })();

    return () => { if (unsub) unsub(); };
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const nextDay = new Date();
      nextDay.setHours(24, 0, 0, 0); // next midnight
      const diff = nextDay.getTime() - now.getTime();

      const hours = Math.floor(diff / 1000 / 60 / 60);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(
        `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`
      );
    };

    const interval = setInterval(updateTimer, 1000);
    updateTimer(); // initialize immediately

    return () => clearInterval(interval);
  }, []);

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
    // Defensive ownership check
    if (ownedSourceIds.has(String(item.id))) {
      alert('You already own this item');
      return;
    }
    // optimistic local update of owned ids
    setOwnedSourceIds(new Set(Array.from(ownedSourceIds).concat([String(item.id)])));

    // Update coins in Firebase
    try {
      await updateCoins(user.uid, newCoins);
    } catch (e) {
      console.warn('Failed to update coins:', e);
    }

    // add to shared inventory (image or name will be stored)
    try {
      // use a stable doc id so duplicates are prevented (subcollection doc id)
      const docId = `item-${item.id}`;
      await addItem({
        id: docId,
        name: item.name,
        image: item.image,
        sourceId: item.id,
      });
    } catch (e) {
      console.warn('Failed to add item to inventory', e);
    }

    alert(`You bought: ${item.name}!`);
  };

const handleSinglePull = async () => {
  if (coins < 100) return;
  setSinglePulling(true);
  const newCoins = coins - 100;
  setCoins(newCoins);

  const user = auth.currentUser;
  if (user) await updateCoins(user.uid, newCoins);

  Animated.loop(
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    })
  ).start();

  setTimeout(async () => {
    const item = getRandomItem();
    setResultItem(item);
    setShowResult(true);
    setSinglePulling(false);
    spinAnim.setValue(0);

    // Add item to inventory...
  }, 2000);
};

const handleTenPull = async () => {
  if (coins < 1000) return;
  setTenPulling(true);
  const newCoins = coins - 1000;
  setCoins(newCoins);

  const user = auth.currentUser;
  if (user) await updateCoins(user.uid, newCoins);

  Animated.loop(
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    })
  ).start();

  setTimeout(async () => {
    const pulledItems: GachaItem[] = [];
    const currentInventory = await getInventory();
    const ownedIds = new Set(currentInventory.map(i => i.sourceId));

    for (let i = 0; i < 10; i++) {
      const item = getRandomItem();
      pulledItems.push(item);

      if (!ownedIds.has(item.id)) {
        await addItem({
          id: `gacha-${item.id}-${Date.now()}-${i}`,
          name: item.name,
          image: item.image,
          rarity: item.rarity,
          sourceId: item.id,
        });
        setOwnedSourceIds(prev => new Set([...prev, String(item.id)]));
      }
    }

    setResultItems(pulledItems);
    setShowMultiResult(true);
    setTenPulling(false);
    spinAnim.setValue(0);
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
            const isPurchased = ownedSourceIds.has(String(item.id));
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
                    <Text style={styles.purchasedText}>Owned</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={{ marginVertical: 0, alignItems: 'center' }}>
          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>
            Daily Store Refresh In:
          </Text>
          <Text style={{ color: '#facc15', fontWeight: '800', fontSize: 20 }}>
            {timeLeft}
          </Text>
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

          <TouchableOpacity
            style={styles.ratesButton}
            onPress={() => setRatesModalVisible(true)}
          >
            <Text style={styles.ratesButtonText}>View Rates</Text>
          </TouchableOpacity>
            
          <Modal
            visible={ratesModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setRatesModalVisible(false)}
            >
            <View style={styles.modalBackdrop}>
              <View style={styles.ratesModalCard}>
                <Text style={styles.ratesTitle}>Gacha Rates</Text>
                
                {GACHA_ITEMS.map(item => (
                  <Text key={item.id} style={styles.ratesText}>
                    {item.name} ({item.rarity.toUpperCase()}) - {item.probability}%
                  </Text>
                ))}

                <TouchableOpacity
                  style={styles.okButton}
                  onPress={() => setRatesModalVisible(false)}
                >
                  <Text style={styles.okButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Current Coins */}
          <Text style={styles.title}>Your Coins</Text>
          <Text style={styles.coinAmount}>{coins}</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 12 }}>
            <TouchableOpacity
              style={[styles.pullButton, { opacity: coins < 100 || singlePulling ? 0.5 : 1 }]}
              onPress={handleSinglePull}
              disabled={coins < 100 || singlePulling}
            >
              <Text style={styles.pullButtonText}>{singlePulling ? 'Pulling...' : '1 PULL (100 coins)'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pullButton, { opacity: coins < 1000 || tenPulling ? 0.5 : 1 }]}
              onPress={handleTenPull}
              disabled={coins < 1000 || tenPulling}
            >
              <Text style={styles.pullButtonText}>{tenPulling ? 'Pulling...' : '10 PULL (1000 coins)'}</Text>
            </TouchableOpacity>
          </View>
            
          <Image
            source={require('../../assets/images/other-items.png')}
            style={styles.otherItems}
            resizeMode="contain"
          />
          
        </View>
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

        {/* 10-Pull Result Modal */}
        <Modal visible={showMultiResult} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.resultCard, { borderColor: '#facc15', maxHeight: 400 }]}>
              <Text style={styles.resultTitle}>10 Pull Results</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {resultItems.map((item, index) => (
                  <View key={index} style={{ alignItems: 'center', marginHorizontal: 8 }}>
                    {item.image && (
                      <Image source={item.image} style={styles.resultImage} resizeMode="contain" />
                    )}
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={[styles.resultRarity, { color: RARITY_COLORS[item.rarity] }]}>
                      {item.rarity.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.okButton}
                onPress={() => setShowMultiResult(false)}
              >
                <Text style={styles.okButtonText}>Claim All</Text>
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
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 12,
    width: 150,
  },
  pullButtonText: {
    color: '#022c22',
    fontWeight: '600',
    fontSize: 12,
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
    backgroundColor: '#d7b8cdff',
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
  ratesButton: {
  backgroundColor: '#ffffff',
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 999,
  alignItems: 'center',
  alignSelf: 'flex-start',
  marginBottom: 16,
},
ratesButtonText: {
  color: '#022c22',
  fontWeight: '700',
  fontSize: 14,
},
ratesModalCard: {
  backgroundColor: '#ffffffff',
  borderRadius: 20,
  padding: 24,
  alignItems: 'center',
  width: '80%',
},
ratesTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: '#e40d7cff',
  marginBottom: 16,
},
ratesText: {
  fontSize: 14,
  color: '#000000ff',
  marginBottom: 8,
},

});