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
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const isDarkMode = useColorScheme() === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const styles = createStyles(isDarkMode);

  const handleSignUp = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill out all fields');
      return;
    }
    // Dummy signup success
    Alert.alert('Success', `Welcome!`);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Sign Up</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="done"
        />

        <View style={styles.buttonContainer}>
          <Button title="Sign Up" onPress={handleSignUp} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000' : '#fff',
    },
    scrollContainer: {
      padding: 20,
      justifyContent: 'center',
      flexGrow: 1,
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
  });

export default SignUpScreen;
