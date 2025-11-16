import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, Animated } from 'react-native';
import { useState, useRef, useEffect } from 'react';

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
    setTimeout(() => {
      const item = getRandomItem();
      setResultItem(item);
      setShowResult(true);
      setPulling(false);
      spinAnim.setValue(0);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Gacha System 🎰</Text>
        <Text style={styles.subtitle}>Pull for rare items! (100 coins per pull)</Text>

        {/* Coin Display */}
        <View style={styles.coinDisplay}>
          <Text style={styles.coinLabel}>Your Coins</Text>
          <Text style={styles.coinAmount}>{coins}</Text>
        </View>

        {/* Gacha Pull Section */}
        <View style={styles.gachaContainer}>
          <Text style={styles.gachaTitle}>Try Your Luck!</Text>
          
          {/* Rarity Info */}
          <View style={styles.rarityInfo}>
            <View style={styles.rarityRow}>
              <Text style={[styles.rarityLabel, { color: RARITY_COLORS.common }]}>🔴 Common 50%</Text>
              <Text style={[styles.rarityLabel, { color: RARITY_COLORS.rare }]}>🔵 Rare 25%</Text>
            </View>
            <View style={styles.rarityRow}>
              <Text style={[styles.rarityLabel, { color: RARITY_COLORS.epic }]}>🟣 Epic 5%</Text>
              <Text style={[styles.rarityLabel, { color: RARITY_COLORS.legendary }]}>🟡 Legendary 1%</Text>
            </View>
          </View>

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

        {/* Rarity Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Rarity Guide</Text>
          <Text style={styles.infoText}>
            Common items are easy to get. Rare items are harder. Epic items are very rare. Legendary items are extremely rare!
          </Text>
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
    paddingHorizontal: 24,
    paddingVertical: 48,
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
  coinDisplay: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  coinLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  coinAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fbbf24',
  },
  gachaContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  gachaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 16,
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
    backgroundColor: '#22c55e',
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
  infoCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#facc15',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 18,
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
});