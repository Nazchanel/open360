import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App'; // adjust this path as needed

const DashboardScreen = () => {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [groupCode, setGroupCode] = React.useState('');

  // Utility to generate a 6-letter uppercase code
  const generateRandomCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

const createGroup = async () => {
  const code = generateRandomCode();
  try {
    await firestore()
      .collection('groups')
      .doc(code)
      .set({
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    Alert.alert('Success', `Group "${code}" created`);
  } catch (error) {
    console.error(error);
    Alert.alert('Error', 'Failed to create group');
  }
};


  const handleTextChange = (text: string) => {
    const formatted = text.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 6);
    setGroupCode(formatted);
  };

  const handleLogout = async () => {
    await auth().signOut();
    navigation.replace('Login');
  };

  const themeStyles = isDark ? darkTheme : lightTheme;

  return (
    <KeyboardAvoidingView
      style={[styles.container, themeStyles.container]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top: Create Group Box */}
      <View style={[styles.box, themeStyles.box]}>
        <Text style={[styles.title, themeStyles.title]}>Create Group</Text>
        <TouchableOpacity style={[styles.button, themeStyles.button]} onPress={createGroup}>
          <Text style={[styles.buttonText, themeStyles.buttonText]}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom: Join Group Input */}
      <View style={styles.joinContainer}>
        <Text style={[styles.label, themeStyles.label]}>Join Group</Text>
        <TextInput
          style={[styles.input, themeStyles.input]}
          value={groupCode}
          onChangeText={handleTextChange}
          maxLength={6}
          autoCapitalize="characters"
          placeholder="ABCDEF"
          placeholderTextColor={isDark ? '#888' : '#aaa'}
        />
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  box: {
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  joinContainer: {
    paddingBottom: 30,
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    letterSpacing: 2,
    textAlign: 'center',
  },
  logoutBtn: {
    alignSelf: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#ff5c5c',
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

const lightTheme = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
  },
  box: {
    backgroundColor: '#ffffff',
  },
  title: {
    color: '#111',
  },
  button: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    color: '#fff',
  },
  label: {
    color: '#222',
  },
  input: {
    borderColor: '#ccc',
    color: '#111',
    backgroundColor: '#fff',
  },
});

const darkTheme = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
  },
  box: {
    backgroundColor: '#1e1e1e',
  },
  title: {
    color: '#f5f5f5',
  },
  button: {
    backgroundColor: '#1e90ff',
  },
  buttonText: {
    color: '#fff',
  },
  label: {
    color: '#f0f0f0',
  },
  input: {
    borderColor: '#444',
    color: '#f5f5f5',
    backgroundColor: '#2a2a2a',
  },
});

export default DashboardScreen;
