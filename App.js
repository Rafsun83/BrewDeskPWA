import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import RoleSelect from './src/screens/RoleSelect';
import OrderScreen from './src/screens/OrderScreen';
import StaffScreen from './src/screens/StaffScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AdminScreen from './src/screens/AdminScreen';
import { getMyProfile } from './src/db';
import { colors } from './src/theme';

export default function App() {
  // 'home' | 'loading' | 'register' | 'editProfile' | 'user' | 'staff' | 'admin'
  const [screen, setScreen] = useState('home');
  const [profile, setProfile] = useState(null);

  // Entering the user side: load this phone's registered profile first.
  // No profile yet (or it was removed by an admin) → registration screen.
  const enterUserSide = async () => {
    setScreen('loading');
    let mine = null;
    try {
      mine = await getMyProfile();
    } catch (e) {
      // offline — fall through; with no cached profile the user can
      // still see the registration screen and retry from there
    }
    setProfile(mine);
    setScreen(mine ? 'user' : 'register');
  };

  const pickRole = (role) => {
    if (role === 'user') enterUserSide();
    else setScreen(role);
  };

  return (
    <>
      <StatusBar style="light" />
      {screen === 'home' && <RoleSelect onPickRole={pickRole} />}
      {screen === 'loading' && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.caramel} />
        </View>
      )}
      {screen === 'register' && (
        <RegisterScreen
          onBack={() => setScreen('home')}
          onDone={(p) => {
            setProfile(p);
            setScreen('user');
          }}
        />
      )}
      {screen === 'editProfile' && (
        <RegisterScreen
          existing={profile}
          onBack={() => setScreen('user')}
          onDone={(p) => {
            setProfile(p);
            setScreen('user');
          }}
        />
      )}
      {screen === 'user' && profile && (
        <OrderScreen
          profile={profile}
          onBack={() => setScreen('home')}
          onEditProfile={() => setScreen('editProfile')}
          onProfileGone={() => {
            // admin removed this profile (or the ID was re-registered)
            setProfile(null);
            setScreen('register');
          }}
        />
      )}
      {screen === 'staff' && <StaffScreen onBack={() => setScreen('home')} />}
      {screen === 'admin' && <AdminScreen onBack={() => setScreen('home')} />}
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
