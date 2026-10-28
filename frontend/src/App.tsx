import React from 'react';
import { AuthProvider } from './AuthContext';
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}

export default App;

