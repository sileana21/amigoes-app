import { router } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useState } from 'react';
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform, SafeAreaView, StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from './firebaseConfig';


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------
  // LOGIN
  // ---------------------------
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      router.replace('/(tabs)');
    } catch (e: any) {
      console.log('Login error:', e);
      if (e.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // SIGN UP
  // ---------------------------
  const handleSignup = async () => {
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

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

  // ---------------------------
  // RENDER UI
  // ---------------------------
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
              source={require('../assets/images/login-title.png')}
              style={styles.loginTitle}
            />

            <Image
              source={require('../assets/images/login-subtitle.png')}
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

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#6b7280"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity onPress={() => router.push('/reset-password')}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <Image
                source={
                  loading
                    ? require('../assets/images/logging-in-button.png')
                    : require('../assets/images/login-button-2.png') 
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

// ---------------------------
// STYLES
// ---------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 30,
    paddingVertical: 60,
  },
  forgotPasswordText: {
    color: '#ffffffff',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 15,
    color: '#e5e7eb',
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    color: '#ffffffff',
    marginBottom: 4,
    marginTop: 8,
  },
  loginTitle: {
    width: '100%',
    height: 40,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#ffffffff',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#80A1BA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#000000ff',
  },
  loginButton: {
    width: 200,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  loginButtonImage: {
    width: 200,
    height: 50,
  },
  linkButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkText: {
    color: '#ffffffff',
    fontSize: 17,
  },
  errorText: {
    color: '#ee6055',
    marginTop: 8,
  },
});
