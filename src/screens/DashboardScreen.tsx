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
  ScrollView,
  Modal,
  RefreshControl
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
  const [groupNames, setGroupNames] = React.useState<Record<string, string>>({});
  
  const [showGroupNameModal, setShowGroupNameModal] = React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    fetchUserGroups();
  }, []);
  
  // Fetch group names when userGroups changes
  React.useEffect(() => {
    const fetchNames = async () => {
      const names: Record<string, string> = {};
      for (const groupId of userGroups) {
        try {
          const doc = await firestore().collection('groups').doc(groupId).get();
          const data = doc.data();
          names[groupId] = data?.name || groupId;
        } catch {
          names[groupId] = groupId;
        }
      }
      setGroupNames(names);
    };
    if (userGroups.length > 0) fetchNames();
  }, [userGroups]);
  
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
  
  // Function to generate random X-character group ID
  // This can be adjusted to any length as needed
  const generateGroupID = (length: number = 15) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charactersLength);
      result += characters[randomIndex];
    }
    
    return result;
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
  // Handle Join Group with ID
  
  const handleJoinGroupWithID = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to join a group.');
      return;
    }
    const name = currentUser?.email ? currentUser.email.split('@')[0] : 'anon';
    if (groupCode.length !== 6) {
      Alert.alert('Error', 'Group code must be exactly 15 characters.');
      return;
    };
    try {
      const documentSnapshot = await firestore()
      .collection('codes')
      .doc(groupCode)
      .get()
      
      if (documentSnapshot.data() === undefined) {
        Alert.alert('Error', 'Group Code is not valid');
        return;
      }
      const codeData = documentSnapshot.data();
      console.log('Code data:', codeData);
      // Check if codeData and expirationTime
      if (!codeData || !codeData.expirationTime) {
        Alert.alert('Error', 'Invalid group code data');
        return;
      }
      // Check if current time is before the expiration time
      const currentTime = firebase.firestore.Timestamp.now(); // Get current time
      
      if (currentTime.toMillis() > codeData.expirationTime.toMillis()) {
        Alert.alert('Error', 'Group code has expired');
        return;
      }
      // Proceed to join the group
      const groupId = codeData.groupID;
      
      // Use the existing join group logic
      const documentSnapshotGroup = await firestore()
      .collection('groups')
      .doc(groupId)
      .get();
      if (documentSnapshotGroup.data() === undefined) {
        Alert.alert('Error', 'Group does not exist');
        return;
      }
      const groupData = documentSnapshotGroup.data();
      const members: string[] = groupData?.members ?? [];
      if (members.includes(name)) {
        Alert.alert('Info', 'You are already a member of this group.');
        return; // Stop here, no need to add again
      }
      console.log('Group data:', documentSnapshotGroup.data());
      await firestore()
      .doc(`groups/${groupId}`)
      .update({
        members: firestore.FieldValue.arrayUnion(name),
        [`roles.${name}`]: 'member',
      });
      await addGroupToUser(groupId);
      fetchUserGroups();
      // You might want to show a success message or navigate here
      Alert.alert('Success', 'You have joined the group!');
      
    }
    
    catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'An error occurred while trying to join the group.');
    }
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
        return;
      }
      
      const groupData = documentSnapshot.data();
      const members: string[] = groupData?.members ?? [];
      
      if (members.includes(name)) {
        Alert.alert('Info', 'You are already a member of this group.');
        return;
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
  const handleCreateGroup = () => {
    setShowGroupNameModal(true);
  };
  
  const actuallyCreateGroup = async (groupName: string) => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to create a group.');
      return;
    }
    const userId = currentUser.uid;
    const emailUsername = currentUser?.email ? currentUser.email.split('@')[0]: 'anon';
    const newGroupCode = generateGroupID();
    try {
      await firestore()
        .collection('groups')
        .doc(newGroupCode)
        .set({
          createdAt: firestore.FieldValue.serverTimestamp(),
          createdBy: userId,
          createdByName: emailUsername,
          name: groupName,
          members: [emailUsername],
          roles: { [emailUsername]: 'admin' },
          locations: { [emailUsername]: 'admin' },
        });
      Alert.alert('Success', `Group created`);
      await addGroupToUser(newGroupCode);
      fetchUserGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group.');
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserGroups();
    setRefreshing(false);
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
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={isDark ? '#fff' : '#333'} />
    }
    >
    {/* Header Row */}
    <View style={styles.headerContainer}>
      <Text style={[styles.header, themeStyles.title]}>
        Hello, {auth().currentUser?.email?.split('@')[0] || 'User'}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Small User Settings button to the left of Logout */}
        <TouchableOpacity
          style={{
            backgroundColor: '#888',
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 8,
            marginRight: 8,
            alignItems: 'center',
            justifyContent: 'center',
            height: 36,
          }}
          onPress={() => navigation.navigate('UserSettings')}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>User Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtnTop}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
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
    <Modal
      visible={showGroupNameModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowGroupNameModal(false)}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ backgroundColor: isDark ? '#222' : '#fff', padding: 24, borderRadius: 12, width: '80%' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: isDark ? '#fff' : '#222' }}>Enter Group Name</Text>
          <TextInput
            value={newGroupName}
            onChangeText={setNewGroupName}
            placeholder="Group Name"
            placeholderTextColor={isDark ? '#aaa' : '#888'}
            style={{ borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 16, color: isDark ? '#fff' : '#222', backgroundColor: isDark ? '#333' : '#fff', borderColor: isDark ? '#444' : '#ccc' }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity onPress={() => setShowGroupNameModal(false)} style={{ marginRight: 16 }}>
              <Text style={{ color: isDark ? '#aaa' : '#888' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              if (!newGroupName.trim()) {
                Alert.alert('Error', 'Please enter a group name.');
                return;
              }
              setShowGroupNameModal(false);
              await actuallyCreateGroup(newGroupName.trim());
              setNewGroupName('');
            }}>
              <Text style={{ color: isDark ? '#4da6ff' : '#007bff', fontWeight: 'bold' }}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    
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
        <Text style={styles.joinButtonText}>{groupNames[group] || group}</Text>
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
    <TouchableOpacity style={[styles.joinButton, { marginTop: 0 }]} onPress={handleJoinGroupWithID}>
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
