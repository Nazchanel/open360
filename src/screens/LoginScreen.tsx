import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const isDarkMode = useColorScheme() === 'dark';

  const styles = createStyles(isDarkMode);

  const handleLogin = async () => {
    const email = username + "@open360.com";
    try {
      await auth().signInWithEmailAndPassword(email, password);
      // Alert.alert('Success', 'Logged in!');
      navigation.replace('Dashboard');
    } catch (error: any) {
      let message = 'Login failed';
      if (error.code === 'auth/invalid-email') message = 'Invalid email address';
      if (error.code === 'auth/user-not-found') message = 'No user found';
      if (error.code === 'auth/wrong-password') message = 'Incorrect password';
      Alert.alert('Error', message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login</Text>
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
      <Button title="Login" onPress={handleLogin} />
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
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
    link: {
      marginTop: 15,
      color: dark ? '#4da6ff' : '#0066cc',
      textAlign: 'center',
    },
  });

export default LoginScreen;
