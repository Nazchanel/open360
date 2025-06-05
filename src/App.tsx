import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import JoinGroup from './components/JoinGroup';
import CreateGroup from './components/CreateGroup';
import PeerConnection from './components/PeerConnection';

const App: React.FC = () => {
  const [userName, setUserName] = useState('');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/create" />} />
        <Route
          path="/create"
          element={<CreateGroup onCreate={(groupId, name) => {
            setUserName(name);
          }} />}
        />
        <Route
          path="/join"
          element={<JoinGroup onJoin={(groupId, name) => {
            setUserName(name);
          }} />}
        />
        <Route
          path="/group/:groupId"
          element={userName ? <PeerConnection userName={userName} /> : <Navigate to="/join" />}
        />
      </Routes>
    </Router>
  );
};

export default App;
