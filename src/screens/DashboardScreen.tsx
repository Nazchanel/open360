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
  ScrollView
} from 'react-native';
import auth, { firebase } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App'; // adjust this path as needed

const DashboardScreen = () => {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [groupCode, setGroupCode] = React.useState('');
  
  const handleTextChange = (text: string) => {
    const formatted = text.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 6);
    setGroupCode(formatted);
  };
  
  const handleLogout = async () => {
    await auth().signOut();
    navigation.replace('Login');
  };
  
  // Function to generate random 6-letter uppercase code
  const generateRandomCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return code;
  };
  
  // Handle Join Button Press
  const handleJoinGroup = async () => {
    const currentUser = auth().currentUser;
    const name = currentUser?.email ? currentUser.email.split('@')[0] : 'anon';
    
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to join a group.');
      return;
    }
    
    try {
      const documentSnapshot = await firestore()
      .collection('groups')
      .doc(groupCode)
      .get();
      
      if (documentSnapshot.data() === undefined) {
        Alert.alert('Error', 'Group does not exist');
        return; // 🚨 Exit to prevent running the rest of the code
      }
      
      console.log('Group data:', documentSnapshot.data());
      
      await firestore()
      .doc(`groups/${groupCode}`)
      .update({
        members: firestore.FieldValue.arrayUnion(name),
        [`roles.${name}`]: 'member',
      });
      
      // You might want to show a success message or navigate here
      Alert.alert('Success', 'You have joined the group!');
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'An error occurred while trying to join the group.');
    }
  };
  
  // Handle Create button press
  const handleCreateGroup = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to create a group.');
      return;
    }
    const userId = currentUser.uid;
    const emailUsername = currentUser?.email ? currentUser.email.split('@')[0]: 'anon';
    
    const newGroupCode = generateRandomCode();
    
    try {
      await firestore()
      .collection('groups')
      .doc(newGroupCode)
      .set({
        createdAt: firestore.FieldValue.serverTimestamp(),
        createdBy: userId,
        createdByName: emailUsername,
        members:[emailUsername],
        roles:{[emailUsername]:"admin"}
      });
      
      Alert.alert('Success', `Group created with code: ${newGroupCode}`);
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group.');
    }
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
    <TouchableOpacity
    style={[styles.button, themeStyles.button]}
    onPress={handleCreateGroup}
    >
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
    <TouchableOpacity style={styles.joinButton} onPress={handleJoinGroup}>
    <Text style={styles.joinButtonText}>Enter</Text>
    </TouchableOpacity>
    </View>
    
    {/* Logout Button */}
    <TouchableOpacity style={[styles.logoutBtn]} onPress={handleLogout}>
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
  joinButton: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
