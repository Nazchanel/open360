import CryptoJS from 'crypto-js';

export interface UserData {
  id: string;
  username: string;
  recoveryPhrase: string;
  groups: string[];
}

const generateRecoveryPhrase = (): string => {
  const words = [...Array(6)].map(() => 
    Math.random().toString(36).substring(2, 6)
  );
  return words.join('-');
};

export const createAccount = (username: string, password: string): UserData => {
  const userData: UserData = {
    id: Math.random().toString(36).substr(2, 9),
    username,
    recoveryPhrase: generateRecoveryPhrase(),
    groups: []
  };
  
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(userData),
    password
  ).toString();
  
  localStorage.setItem('userData', encrypted);
  return userData;
};

export const login = (password: string): UserData | null => {
  const encrypted = localStorage.getItem('userData');
  if (!encrypted) return null;

  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, password);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch {
    return null;
  }
};

export const updateUserData = (userData: UserData, password: string) => {
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(userData),
    password
  ).toString();
  localStorage.setItem('userData', encrypted);
};