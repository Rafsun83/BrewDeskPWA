import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import RoleSelect from './src/screens/RoleSelect';
import OrderScreen from './src/screens/OrderScreen';
import StaffScreen from './src/screens/StaffScreen';

export default function App() {
  // 'home' | 'user' | 'staff'  — simple navigation, no extra libraries
  const [screen, setScreen] = useState('home');

  return (
    <>
      <StatusBar style="light" />
      {screen === 'home' && <RoleSelect onPickRole={setScreen} />}
      {screen === 'user' && <OrderScreen onBack={() => setScreen('home')} />}
      {screen === 'staff' && <StaffScreen onBack={() => setScreen('home')} />}
    </>
  );
}
