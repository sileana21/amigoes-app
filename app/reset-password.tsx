import { router, Stack } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import {
	Image,
	ImageBackground,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { auth } from './firebaseConfig';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage('Password reset email sent! Check your inbox.');
    } catch (e: any) {
      console.log('Reset password error:', e);
      if (e.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (e.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hide the default header */}
      <Stack.Screen options={{ headerShown: false }} />

      <ImageBackground
        source={require('../assets/images/mesh-gradient.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.inner}>
						<Image
							source={require('../assets/images/reset-title.png')}
							style={styles.resetTitle}
						/>
            <Text style={styles.subtitle}>Enter your email and we’ll send a reset link.</Text>

            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#6b7280"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}
            {message && <Text style={styles.messageText}>{message}</Text>}

						<TouchableOpacity
							style={styles.resetButton}
							onPress={handleResetPassword}
							disabled={loading}
						>
							<Image
								source={
									loading
										? require('../assets/images/sending-button.png') 
										: require('../assets/images/send-reset-email-button.png')
								}
								style={styles.resetButtonImage}
								resizeMode="contain"
							/>
						</TouchableOpacity>

            <TouchableOpacity
							style={styles.resetButton}
							onPress={() => router.back()}
						>
							<Image
								source={require('../assets/images/back-to-login-button.png')}
								style={styles.resetButtonImage}
								resizeMode="contain"
							/>
						</TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 20 
  },
  inner: { 
		flex: 1, 
		justifyContent: 'center' 
	},
  resetTitle: {
    width: 300,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  subtitle: { 
		fontSize: 17, 
		color: '#ffffffff', 
		marginBottom: 20 
	},
  input: {
		backgroundColor: '#ffffffff',
		borderRadius: 10,
		borderWidth: 3,
		borderColor: '#80A1BA',
		paddingHorizontal: 12,
		paddingVertical: 10,
		color: '#80A1BA',
	},
  errorText: { 
		color: '#ee6055', 
		marginTop: 4 
	},
  messageText: { 
		color: '#ffffffff', 
		marginTop: 4 
	},
	resetButton: {
    width: 200,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  resetButtonImage: {
    width: 200,
    height: 50,
  },
});
