import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import CreateJoinGroup from './components/CreateJoinGroup';
import GroupMap from './components/GroupMap';
import UserProfile from './components/UserProfile';

const AuthWrapper = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/groups" /> : <AuthScreen />;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/" />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AuthWrapper />} />
          <Route path="/groups" element={<ProtectedRoute><CreateJoinGroup /></ProtectedRoute>} />
          <Route path="/group/:groupId" element={<ProtectedRoute><GroupMap /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
