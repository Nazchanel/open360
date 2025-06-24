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
import type { RootStackParamList } from '../../App';

const DashboardScreen = () => {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [groupCode, setGroupCode] = React.useState('');
  const [userGroups, setUserGroups] = React.useState<string[]>([]);
  
  React.useEffect(() => {
    fetchUserGroups();
  }, []);
  
  
  const fetchUserGroups = () => {
    getUserGroups()
    .then(groups => {
      if (groups && Array.isArray(groups)) {
        setUserGroups(groups);
      } else {
        setUserGroups([]);
      }
    })
    .catch(error => {
      console.error('Error fetching user groups:', error);
      setUserGroups([]);
    });
  };
  
  const handleTextChange = (text: string) => {
    const formatted = text.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 6);
    setGroupCode(formatted);
  };
  
  const handleLogout = async () => {
    await auth().signOut();
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
  
  // Returns an array of group members given a group (Array Implementation without roles)
  async function getGroupMembers(group : string): Promise<string[] | undefined> {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to create a group.');
      return;
    }
    const docSnapshot = await firestore()
    .collection('groups')
    .doc(group)
    .get();
    
    const members = docSnapshot.get('members');
    if (Array.isArray(members)) {
      return members as string[];
    }
    
    return undefined;
  } 
  
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
        return;
      }
      
      const groupData = documentSnapshot.data();
      const members: string[] = groupData?.members ?? [];
      
      if (members.includes(name)) {
        Alert.alert('Info', 'You are already a member of this group.');
        return; // Stop here, no need to add again
      }
      
      console.log('Group data:', documentSnapshot.data());
      
      await firestore()
      .doc(`groups/${groupCode}`)
      .update({
        members: firestore.FieldValue.arrayUnion(name),
        [`roles.${name}`]: 'member',
      });
      
      await addGroupToUser(groupCode);
      
      fetchUserGroups();
      
      // You might want to show a success message or navigate here
      Alert.alert('Success', 'You have joined the group!');
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'An error occurred while trying to join the group.');
    }
  };
  const addGroupToUser = async (code : string) => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to create a group.');
      return;
    }
    const emailUsername = currentUser?.email ? currentUser.email.split('@')[0]: 'anon';
    
    try {
      await firestore()
      .collection('users')
      .doc(emailUsername)
      .set(
        {
          groups: firestore.FieldValue.arrayUnion(code),
        },
        { merge: true }
      );
      
      
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group.');
    }
    
  };
  
  async function getUserGroups(): Promise<string[] | undefined> {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to create a group.');
      return;
    }
    const username = currentUser?.email ? currentUser.email.split('@')[0]: 'anon';
    const docSnapshot = await firestore()
    .collection('users')
    .doc(username)
    .get();
    
    const groups = docSnapshot.get('groups');
    if (Array.isArray(groups)) {
      return groups as string[];
    }
    
    return undefined;
  }
  
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
        roles:{[emailUsername]:"admin"},
        locations:{[emailUsername]:"admin"},
      });
      
      // Add group to users collection for current user
      
      
      Alert.alert('Success', `Group created with code: ${newGroupCode}`);
      
      await addGroupToUser(newGroupCode);
      fetchUserGroups();
      
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
    <ScrollView
    contentContainerStyle={{ paddingBottom: 90, paddingTop: 24 }} // more top padding
    keyboardShouldPersistTaps="handled"
    >
    {/* Header Row */}
    <View style={styles.headerContainer}>
    <Text style={[styles.header, themeStyles.title]}>
    Hello, {auth().currentUser?.email?.split('@')[0] || 'User'}
    </Text>
    <TouchableOpacity onPress={handleLogout} style={styles.logoutBtnTop}>
    <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
    </View>
    
    {/* Create Group Box */}
    <View style={[styles.box, themeStyles.box, { marginBottom: 28 }]}> {/* more space below */}
    <Text style={[styles.title, themeStyles.title, { marginBottom: 20 }]}>Create Group</Text>
    <TouchableOpacity
    style={[styles.button, themeStyles.button, { marginTop: 8 }]}
    onPress={handleCreateGroup}
    >
    <Text style={[styles.buttonText, themeStyles.buttonText]}>Create</Text>
    </TouchableOpacity>
    </View>
    
    {/* Available Groups Box (conditionally rendered) */}
    {userGroups.length > 0 && (
      <View style={[styles.box, themeStyles.box, { marginBottom: 28 }]}> {/* more space below */}
      <Text style={[styles.title, themeStyles.title, { marginBottom: 20 }]}>Available Groups</Text>
      <ScrollView
      style={userGroups.length > 3 ? { maxHeight: 180 } : undefined}
      nestedScrollEnabled={true}
      contentContainerStyle={{ paddingBottom: 8 }}
      >
      {userGroups.map((group, index) => (
        <TouchableOpacity
        key={index}
        style={[styles.joinButton, { marginBottom: 10 }]}
        onPress={async () => {
          try {
            const members = await getGroupMembers(group);
            navigation.navigate('Map', {
              username: auth().currentUser?.email?.split('@')[0] || 'User',
              groupName: group,
              members: members ?? [],
            });
          } catch (error) {
            console.error('Failed to fetch members:', error);
            Alert.alert('Error', 'Unable to fetch group members.');
          }
        }}
        >
        <Text style={styles.joinButtonText}>{group}</Text>
        </TouchableOpacity>
      ))}
      </ScrollView>
      </View>
    )}
    
    {/* Join Group Box */}
    <View style={[styles.box, themeStyles.box, { marginBottom: 28 }]}> {/* more space below */}
    <Text style={[styles.title, themeStyles.title, { marginBottom: 20 }]}>Join Group</Text>
    <TextInput
    style={[styles.input, themeStyles.input, { marginBottom: 16 }]}
    value={groupCode}
    onChangeText={handleTextChange}
    maxLength={6}
    autoCapitalize="characters"
    placeholder="ABCDEF"
    placeholderTextColor={isDark ? '#888' : '#aaa'}
    />
    <TouchableOpacity style={[styles.joinButton, { marginTop: 0 }]} onPress={handleJoinGroup}>
    <Text style={styles.joinButtonText}>Enter</Text>
    </TouchableOpacity>
    </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutBtnTop: {
    backgroundColor: '#ff5c5c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  box: {
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
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
