import React, { createContext, useContext, useState } from 'react';
import { createAccount, login, updateUserData, UserData } from './auth';

interface AuthContextType {
  user: UserData | null;
  login: (password: string) => boolean;
  createAccount: (username: string, password: string) => boolean;
  logout: () => void;
  addGroup: (groupId: string, password: string) => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);

  const handleLogin = (password: string) => {
    const loggedInUser = login(password);
    setUser(loggedInUser);
    return !!loggedInUser;
  };

  const handleCreateAccount = (username: string, password: string) => {
    const newUser = createAccount(username, password);
    setUser(newUser);
    return !!newUser;
  };

  const handleAddGroup = (groupId: string, password: string) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      groups: [...user.groups, groupId]
    };
    
    updateUserData(updatedUser, password);
    setUser(updatedUser);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login: handleLogin,
      createAccount: handleCreateAccount,
      logout,
      addGroup: handleAddGroup
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);