import { useState, useEffect } from 'react';
import { auth } from '../firebase/firebaseConfig';

export const useUserData = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  return { user };
};

export {}; // Add this to fix isolatedModules error