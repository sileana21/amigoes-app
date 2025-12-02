import { 
  View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity, Alert, 
  ImageBackground, ScrollView, Modal 
} from 'react-native';
import { useEffect, useState } from 'react';
import { auth } from './firebaseConfig';
import { getUserProfile, updateUserProfile } from './userProfileService';
import { updateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export default function EditProfileScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // for reauthentication
  const [modalVisible, setModalVisible] = useState(false);
  const [isPasswordProvider, setIsPasswordProvider] = useState(true); // track provider type

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // Check if user signed in with password or social login
      const providers = user.providerData.map(p => p.providerId);
      setIsPasswordProvider(providers.includes('password'));

      const profile = await getUserProfile(user.uid);
      setUsername(profile?.username || '');
      setEmail(user.email || '');
    };
    loadProfile();
  }, []);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);

  // --- Username Save ---
  const handleUsernameSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!username) {
      Alert.alert('Error', 'Please enter a username.');
      return;
    }

    try {
      await updateUserProfile(user.uid, { username });
      Alert.alert('Success', 'Username updated successfully!');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to update username.');
    }
  };

  // --- Email Save ---
  const handleEmailSave = () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!isEmailValid) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (user.email === email) {
      Alert.alert('No Change', 'Email is the same as current.');
      return;
    }

    // If user is not password-based, cannot change email
    if (!isPasswordProvider) {
      Alert.alert(
        'Cannot Change Email',
        'Your account was created with a social login (Google, Apple, etc.). Email cannot be changed.'
      );
      return;
    }

    // Prompt for password reauthentication
    setModalVisible(true);
  };

  // --- Confirm email update after entering password ---
  const handleEmailUpdateWithPassword = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Reauthenticate with password
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);

      // Update Auth email
      await updateEmail(user, email);

      // Update Firestore email
      await updateUserProfile(user.uid, { email });

      Alert.alert('Success', 'Email updated successfully!');
      setPassword('');
      setModalVisible(false);
    } catch (error: any) {
      console.log(error);
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Incorrect password. Please try again.');
      } else if (error.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Login Required',
          'Your session is too old. Please sign out and sign in again before changing your email.'
        );
      } else {
        Alert.alert('Error', 'Failed to update email.');
      }
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/bg-3.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.title}>Edit Profile</Text>

          {/* Username Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Edit Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new username"
              placeholderTextColor="#ccc"
              value={username}
              onChangeText={setUsername}
              autoComplete="off"
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleUsernameSave}>
              <Text style={styles.saveButtonText}>Save Username</Text>
            </TouchableOpacity>
          </View>

          {/* Email Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Edit Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new email"
              placeholderTextColor="#ccc"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="off"
            />
            {!isEmailValid && email.length > 0 && (
              <Text style={styles.warningText}>Invalid email format</Text>
            )}
            <TouchableOpacity
              style={[styles.saveButton, (!isEmailValid && email.length > 0) && styles.disabledButton]}
              onPress={handleEmailSave}
              disabled={!isEmailValid && email.length > 0}
            >
              <Text style={styles.saveButtonText}>Save Email</Text>
            </TouchableOpacity>
          </View>

          {/* Password Modal for reauthentication */}
          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Enter Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Current password"
                  placeholderTextColor="#ccc"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="off"
                />
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleEmailUpdateWithPassword}
                >
                  <Text style={styles.saveButtonText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: '#ccc', marginTop: 8 }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.saveButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingHorizontal: 16 },
  background: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginVertical: 16 },
  card: { backgroundColor: '#62c1e5', borderRadius: 16, padding: 16, marginBottom: 24 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
  input: { backgroundColor: '#1c96c5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, color: '#fff', marginBottom: 12 },
  warningText: { color: '#ffcc00', fontSize: 12, marginBottom: 8 },
  saveButton: { backgroundColor: '#FFD54F', paddingVertical: 12, borderRadius: 18, alignItems: 'center' },
  saveButtonText: { color: '#126382', fontWeight: '700', fontSize: 16 },
  disabledButton: { backgroundColor: '#ccc' },
  modalBackground: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: { backgroundColor: '#62c1e5', padding: 24, borderRadius: 16, width: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
});
