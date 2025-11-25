import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import {
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth } from './firebaseConfig';
import { createUserProfileIfMissing, isUsernameAvailable } from './userProfileService';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!email || !password || !username) {
      setError('Please fill all fields.');
      return;
    }

    setLoading(true);
    setError(null);
    // Check username availability before creating account
    const available = await isUsernameAvailable(username.trim());
    if (!available) {
      setError('That username is already taken.');
      setLoading(false);
      return;
    }
  try {
    const cred = await createUserWithEmailAndPassword(
      auth, 
      email.trim(), 
      password);

    await createUserProfileIfMissing(cred.user, username.trim());
    
    router.replace('/(tabs)');

  } catch (e: any) {
      console.log('Signup error:', e);
      if (e.code === 'auth/email-already-in-use') {
        setError('That email is already registered.');
      } else if (e.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError('Could not create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/mesh-gradient.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.inner}>
            <Image
              source={require('../assets/images/create-title.png')}
              style={styles.loginTitle}
            />
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="your username"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#6b7280"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
							style={styles.loginButton}
							onPress={handleSignup}
							disabled={loading}
						>
							<Image
								source={
									loading
										? require('../assets/images/creating-button.png')
										: require('../assets/images/create-button.png')
								}
								style={styles.loginButtonImage}
								resizeMode="contain"
							/>
						</TouchableOpacity>

            <TouchableOpacity
							style={styles.loginButton}
							onPress={() => router.back()}
						>
							<Image
								source={require('../assets/images/back-button.png')}
								style={styles.loginButtonImage}
								resizeMode="contain"
							/>
						</TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { 
		flex: 1, 
		backgroundColor: 'transparent' 
	},
  inner: { 
		flex: 1, 
		paddingHorizontal: 30, 
		paddingVertical: 60 
	},
  label: { 
		fontSize: 15, 
		color: '#fff', 
		marginBottom: 4, 
		marginTop: 8 
	},
  loginTitle: { 
		width: '100%', 
		height: 40, 
		resizeMode: 'contain', 
		marginBottom: 10 
	},
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#80A1BA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#000',
  },
	loginButton: {
		width: 200,
		height: 60,
		alignItems: 'center',      // centers content horizontally
		justifyContent: 'center',  // centers content vertically
		alignSelf: 'center',       // centers the button in parent horizontally
		marginTop: 10,             // optional spacing
	},
	loginButtonImage: {
		width: '100%',
		height: '100%',
		resizeMode: 'contain',
	},
	linkText: { 
		color: '#fff', 
		fontSize: 16, 
		textAlign: 'center' 
	},
	errorText: { 
		color: '#ee6055', 
		marginTop: 8 
	},
});
