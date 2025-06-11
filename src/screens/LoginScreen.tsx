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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isDarkMode = useColorScheme() === 'dark';

  const styles = createStyles(isDarkMode);

  const handleSubmit = () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please fill out all fields.');
      return;
    }

    Alert.alert('Login Successful', `Email: ${email}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
        value={email}
        onChangeText={setEmail}
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

      <View style={styles.buttonContainer}>
        <Button title="Login" onPress={handleSubmit} />
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const createStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#000' : '#fff',
    },
    title: {
      fontSize: 28,
      marginBottom: 20,
      textAlign: 'center',
      color: isDarkMode ? '#fff' : '#000',
    },
    input: {
      height: 50,
      borderColor: isDarkMode ? '#444' : '#ccc',
      borderWidth: 1,
      paddingHorizontal: 12,
      marginBottom: 15,
      borderRadius: 8,
      color: isDarkMode ? '#fff' : '#000',
      backgroundColor: isDarkMode ? '#1c1c1e' : '#f9f9f9',
    },
    buttonContainer: {
      marginTop: 10,
    },
    link: {
      marginTop: 15,
      color: isDarkMode ? '#4da6ff' : '#0066cc',
      textAlign: 'center',
    },
  });

export default LoginScreen;
