import React, { useState } from 'react';
import RoleSelect from './screens/RoleSelect.jsx';
import OrderScreen from './screens/OrderScreen.jsx';
import StaffScreen from './screens/StaffScreen.jsx';
import RegisterScreen from './screens/RegisterScreen.jsx';
import AdminScreen from './screens/AdminScreen.jsx';
import { getMyProfile } from './db.js';
import { colors } from './theme.js';

export default function App() {
  // 'home' | 'loading' | 'register' | 'editProfile' | 'user' | 'staff' | 'admin'
  const [screen, setScreen] = useState('home');
  const [profile, setProfile] = useState(null);

  const enterUserSide = async () => {
    setScreen('loading');
    let mine = null;
    try {
      mine = await getMyProfile();
    } catch (e) {
      // offline — show registration screen so user can retry
    }
    setProfile(mine);
    setScreen(mine ? 'user' : 'register');
  };

  const pickRole = (role) => {
    if (role === 'user') enterUserSide();
    else setScreen(role);
  };

  if (screen === 'loading') {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
      </div>
    );
  }

  return (
    <>
      {screen === 'home' && <RoleSelect onPickRole={pickRole} />}
      {screen === 'register' && (
        <RegisterScreen
          onBack={() => setScreen('home')}
          onDone={(p) => { setProfile(p); setScreen('user'); }}
        />
      )}
      {screen === 'editProfile' && (
        <RegisterScreen
          existing={profile}
          onBack={() => setScreen('user')}
          onDone={(p) => { setProfile(p); setScreen('user'); }}
        />
      )}
      {screen === 'user' && profile && (
        <OrderScreen
          profile={profile}
          onBack={() => setScreen('home')}
          onEditProfile={() => setScreen('editProfile')}
          onProfileGone={() => { setProfile(null); setScreen('register'); }}
        />
      )}
      {screen === 'staff' && <StaffScreen onBack={() => setScreen('home')} />}
      {screen === 'admin' && <AdminScreen onBack={() => setScreen('home')} />}
    </>
  );
}

const styles = {
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100dvh',
    backgroundColor: colors.cream,
  },
  spinner: {
    width: 40,
    height: 40,
    border: `3px solid ${colors.line}`,
    borderTopColor: colors.caramel,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
