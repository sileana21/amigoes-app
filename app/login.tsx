import { router } from 'expo-router';
import { useState } from 'react';

import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from './firebaseConfig';

import { createUserProfileIfMissing } from './userProfileService';

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

      // 🔥 Ensure profile exists
      await createUserProfileIfMissing(cred.user);

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

      // 🔥 Create new user profile
      await createUserProfileIfMissing(cred.user);

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Log in to AmiGOes</Text>
        <Text style={styles.subtitle}>
          Use your email to save your pet and progress.
        </Text>

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

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.primaryText}>
            {loading ? 'Logging in...' : 'Log In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryText}>Back to Onboarding</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={handleSignup}>
          <Text style={styles.linkText}>Create an account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------
// STYLES
// ---------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#facc15',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#e5e7eb',
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: '#e5e7eb',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#020617',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f9fafb',
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryText: {
    color: '#022c22',
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  secondaryText: {
    color: '#e5e7eb',
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkText: {
    color: '#93c5fd',
    fontSize: 13,
  },
  errorText: {
    color: '#fca5a5',
    marginTop: 8,
  },
});
