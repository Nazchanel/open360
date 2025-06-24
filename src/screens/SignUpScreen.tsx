import React, { useState } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;
import firestore from '@react-native-firebase/firestore';

const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const isDarkMode = useColorScheme() === 'dark';
  
  const styles = createStyles(isDarkMode);
  
  const handleSignUp = async () => {
    const email = username.trimStart().trimEnd + "@open360.com";
    try {
      await auth().createUserWithEmailAndPassword(email, password);
      await firestore()
      .collection('users')
      // In Firebase the username is stored as all lowercase, so defaults to that to prevent consistency issues
      .doc(username.toLowerCase())
      .set({
        groups:[]
      })
      .then(() => {
        console.log('User added!');
      });
      Alert.alert('Success', 'Account created!');
      navigation.navigate('Login');
    } catch (error: any) {
      let message = 'Signup failed';
      if (error.code === 'auth/email-already-in-use') message = 'Email already in use';
      if (error.code === 'auth/invalid-email') message = 'Invalid email';
      if (error.code === 'auth/weak-password') message = 'Password too weak';
      Alert.alert('Error', message);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
    <Text style={styles.title}>Sign Up</Text>
    <TextInput
    style={styles.input}
    placeholder="Username"
    placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
    value={username}
    onChangeText={setUsername}
    keyboardType="email-address"
    autoCapitalize="none"
    />
    <TextInput
    style={styles.input}
    placeholder="Password"
    placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
    value={password}
    onChangeText={setPassword}
    secureTextEntry
    />
    <Button title="Sign Up" onPress={handleSignUp} />
    </SafeAreaView>
  );
};

const createStyles = (dark: boolean) =>
  StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: dark ? '#000' : '#fff',
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: 'center',
    color: dark ? '#fff' : '#000',
  },
  input: {
    height: 50,
    borderColor: dark ? '#444' : '#ccc',
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 15,
    borderRadius: 8,
    color: dark ? '#fff' : '#000',
    backgroundColor: dark ? '#1c1c1e' : '#f9f9f9',
  },
});

export default SignUpScreen;
