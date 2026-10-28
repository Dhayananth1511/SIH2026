import React from 'react';
import { AuthProvider } from './AuthContext';
import PrototypeApp from './PrototypeApp';

function App() {
  return (
    <AuthProvider>
      <PrototypeApp />
    </AuthProvider>
  );
}

export default App;

