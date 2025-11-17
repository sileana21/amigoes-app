import { router } from 'expo-router';
import { Image, ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function OnboardingScreen() {
  return (
    <ImageBackground
      source={require('../assets/images/mesh-gradient.png')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Top section: logo, slogan, card title */}
      <View style={styles.header}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/slogan.png')}
          style={styles.sloganImage}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/cardTitle.png')}
          style={styles.cardTitle}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/desc.png')}
          style={styles.descriptionImage}
          resizeMode="contain"
        />
      </View>

      {/* Middle section: card text and buttons */}
      <View style={styles.card}>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/login')}
        >
          <Image
            source={require('../assets/images/login-button-2.png')}
            style={styles.loginButtonImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Image
            source={require('../assets/images/guest-button.png')}
            style={styles.loginButtonImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: 'center', // aligns everything at the top
    alignItems: 'center',
  },
  header: {   
    alignItems: 'center',
    marginBottom: 10, // space between header and card
  },
  logoImage: {
    width: 300,
    height: 110,
    marginBottom: 10,
  },
  sloganImage: {
    width: 350,
    height: 40,
    marginTop: -30, // pulls slogan closer to big logo
    marginBottom: 15, // spacing below slogan
  },
  descriptionImage: {
    width: 400,
    height: 60,
    marginBottom: 20,
  },
  cardTitle: {
    width: 150,
    height: 50,
    marginBottom: 20,
  },
  card: {
    width: '100%',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 999,
    alignItems: 'center',
  },
  loginButton: {
    width: 200,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonImage: {
    width: '100%',
    height: '100%',
  },
  primaryText: {
    color: '#022c22',
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 40,
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