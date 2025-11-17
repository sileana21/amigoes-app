import { useRef, useState } from 'react';
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
import { addItem } from '../inventoryService';

interface GachaItem {
  id: number;
  name: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  probability: number;
}

const GACHA_ITEMS: GachaItem[] = [
  { id: 1, name: 'Red Ball', emoji: '🔴', rarity: 'common', probability: 50 },
  { id: 2, name: 'Blue Ball', emoji: '🔵', rarity: 'common', probability: 50 },
  { id: 3, name: 'Golden Collar', emoji: '✨', rarity: 'rare', probability: 25 },
  { id: 4, name: 'Silver Medal', emoji: '🥈', rarity: 'rare', probability: 20 },
  { id: 5, name: 'Dragon Toy', emoji: '🐉', rarity: 'epic', probability: 5 },
  { id: 6, name: 'Crown', emoji: '�', rarity: 'legendary', probability: 1 },
];

const SHOP_ITEMS = [
  { id: 101, name: "67-Shirt", price: 200, image: require('../../assets/images/shirts/67-shirt.png') },
];

const RARITY_COLORS = {
  common: '#6b7280',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#fbbf24',
};

export default function ShopScreen() {
  const [coins, setCoins] = useState(500);
  const [pulling, setPulling] = useState(false);
  const [resultItem, setResultItem] = useState<GachaItem | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<Set<number>>(new Set());
  const spinAnim = useRef(new Animated.Value(0)).current;

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
  if (coins < item.price) {
    alert("Not enough coins!");
    return;
  }

  setCoins(coins - item.price);
  setPurchasedItems(new Set([...purchasedItems, item.id]));

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

  const handlePull = () => {
    if (coins < 100) return;
    
    setPulling(true);
    setCoins(coins - 100);

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

      // add gacha result to inventory
      try {
        await addItem({
          id: `${Date.now()}-gacha-${item.id}`,
          name: item.name,
          emoji: item.emoji,
          rarity: item.rarity,
          sourceId: item.id,
        });
      } catch (e) {
        console.warn('Failed to add gacha item to inventory', e);
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

            {SHOP_ITEMS.map((item) => {
              const isPurchased = purchasedItems.has(item.id);
              return (
                <View key={item.id} style={styles.itemWrapper}>
                  {/* Price */}
                  <Text style={styles.itemPrice}>{item.price} coins</Text>

                  <Image
                    source={require('../../assets/images/shirts/67-shirt.png')}
                    style={styles.slotItem}
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

          <Text style={styles.title}>Gacha System</Text>

          {/* Gacha Pull Section */}
          {/* Rarity Info */}
          <View style={styles.gachaContainer}>
            <Text style={styles.gachaSubtitle}>
              Spend 100 coins per pull to get a random item from the shop. Each item has a rarity and a chance of appearing:
            </Text>
            <View style={styles.rarityInfo}>
              <View style={styles.rarityRow}>
                <Text style={[styles.rarityLabel, { color: 'white' }]}>🔴 Common - 50%</Text>
                <Text style={[styles.rarityLabel, { color: 'white' }]}>🔵 Rare - 25%</Text>
              </View>
              <View style={styles.rarityRow}>
                <Text style={[styles.rarityLabel, { color: 'white' }]}>🟣 Epic - 0.05%</Text>
                <Text style={[styles.rarityLabel, { color: 'white' }]}>🟡 Legendary - 0.01%</Text>
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
              <Text style={styles.resultTitle}>You Got!</Text>
              <Text style={styles.resultEmoji}>{resultItem?.emoji}</Text>
              <Text style={styles.resultName}>{resultItem?.name}</Text>
              <Text
                style={[
                  styles.resultRarity,
                  { color: resultItem ? RARITY_COLORS[resultItem.rarity] : '#fff' },
                ]}
              >
                ✨ {resultItem?.rarity.toUpperCase()} ✨
              </Text>

              <TouchableOpacity
                style={styles.okButton}
                onPress={() => setShowResult(false)}
              >
                <Text style={styles.okButtonText}>Nice!</Text>
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
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#ffffffff',
  },
  gachaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 20,
    textAlign: 'center',
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
  resultEmoji: {
    fontSize: 80,
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
    color: '#22c55e',
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
});