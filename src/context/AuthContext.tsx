import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  auth, 
  db,
  doc,
  setDoc,
  getDoc,
  encryptData, 
  decryptData 
} from '../firebase/firebaseConfig';

interface UserData {
  id: string;
  username: string;
  recoveryPhrase: string;
  groups: string[];
}

interface AuthContextType {
  user: UserData | null;
  login: (username: string, password: string) => Promise<boolean>;
  createAccount: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  addGroup: (groupId: string, userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, 'web-users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          try {
            const decryptedData = decryptData(docSnap.data().encryptedData, firebaseUser.uid);
            if (decryptedData) {
              setUser(decryptedData);
            }
          } catch (error) {
            console.error('Decryption error:', error);
          }
        }
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        `${username}@open360.com`,
        password
      );
      
      const docRef = doc(db, 'web-users', userCredential.user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const decryptedData = decryptData(docSnap.data().encryptedData, userCredential.user.uid);
        setUser(decryptedData);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const createAccount = async (username: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        `${username}@open360.com`,
        password
      );
      
      const recoveryPhrase = generateRecoveryPhrase();
      const userData: UserData = {
        id: userCredential.user.uid,
        username,
        recoveryPhrase,
        groups: []
      };
      
      const encryptedData = encryptData(userData, userCredential.user.uid);
      await setDoc(doc(db, 'web-users', userCredential.user.uid), { encryptedData });
      
      setUser(userData);
      return true;
    } catch (error) {
      console.error("Create account error:", error);
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const addGroup = async (groupId: string, userId: string) => {
    if (!user) return;
    
    // Check if user is already in the group
    if (user.groups.includes(groupId)) return;
    
    const updatedUser = {
      ...user,
      groups: [...user.groups, groupId]
    };
    
    try {
      const encryptedData = encryptData(updatedUser, userId);
      await setDoc(doc(db, 'web-users', userId), { encryptedData });
      setUser(updatedUser);
    } catch (error) {
      console.error('Error adding group:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      createAccount,
      logout,
      addGroup
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

const generateRecoveryPhrase = () => {
  const words = [...Array(6)].map(() => 
    Math.random().toString(36).substring(2, 6)
  );
  return words.join('-');
};