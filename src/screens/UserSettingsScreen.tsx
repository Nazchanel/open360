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

type Props = NativeStackScreenProps<RootStackParamList, 'UserSettings'>;

const UserSettingsScreen: React.FC<Props> = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const isDarkMode = useColorScheme() === 'dark';
    
    const styles = createStyles(isDarkMode);
    const themeStyles = isDarkMode ? darkTheme : lightTheme;
    
    return (
        <View style={styles.headerContainer}>        
        
        <Text style={[styles.header, themeStyles.title]}>
            User Settings
        </Text>       
        
        </View>
    );
};

const createStyles = (dark: boolean) =>
    StyleSheet.create({
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        marginTop: 20,
        marginHorizontal: 20,
    },
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: dark ? '#000' : '#fff',
    },
    title: {
        // center to top left
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
    backButtonText: {
        color: dark ? '#4da6ff' : '#0066cc',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
    backButton: {
        padding: 10,
        backgroundColor: dark ? '#333' : '#f0f0f0',
        borderRadius: 8,
        marginTop: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
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
export default UserSettingsScreen;