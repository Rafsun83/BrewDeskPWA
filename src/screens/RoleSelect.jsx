import React, { useState } from 'react';
import { STAFF_PIN, ADMIN_PIN } from '../config.js';
import { colors, radius, shadow } from '../theme.js';
import logoUrl from '../../assets/splash-icon.png';

export default function RoleSelect({ onPickRole }) {
  const [pinFor, setPinFor] = useState(null);
  const [pin, setPin] = useState('');

  const tryPinLogin = () => {
    const expected = pinFor === 'admin' ? ADMIN_PIN : STAFF_PIN;
    if (pin === expected) {
      const role = pinFor;
      setPin('');
      setPinFor(null);
      onPickRole(role);
    } else {
      window.alert('Wrong PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <img src={logoUrl} style={s.logo} alt="BrewDesk" />
        <p style={s.title}>BrewDesk</p>
        <p style={s.subtitle}>Request coffee &amp; snacks. Staff serves them. Simple.</p>
      </div>

      <button style={{ ...s.card, ...shadow.card }} onClick={() => onPickRole('user')}>
        <span style={s.cardEmoji}>🙋</span>
        <div style={s.cardTextWrap}>
          <p style={s.cardTitle}>I want something</p>
          <p style={s.cardDesc}>Order coffee, tea or snacks</p>
        </div>
        <span style={s.cardArrow}>›</span>
      </button>

      <button style={{ ...s.card, ...s.staffCard, ...shadow.card }} onClick={() => setPinFor('staff')}>
        <span style={s.cardEmoji}>🧑‍🍳</span>
        <div style={s.cardTextWrap}>
          <p style={{ ...s.cardTitle, color: '#FFF' }}>Staff panel</p>
          <p style={{ ...s.cardDesc, color: 'rgba(255,255,255,0.75)' }}>See requests &amp; serve them</p>
        </div>
        <span style={{ ...s.cardArrow, color: '#FFF' }}>›</span>
      </button>

      <button style={{ ...s.card, ...s.adminCard, ...shadow.card }} onClick={() => setPinFor('admin')}>
        <span style={s.cardEmoji}>🛡️</span>
        <div style={s.cardTextWrap}>
          <p style={{ ...s.cardTitle, color: '#FFF' }}>Admin panel</p>
          <p style={{ ...s.cardDesc, color: 'rgba(255,255,255,0.75)' }}>Approve &amp; manage employee profiles</p>
        </div>
        <span style={{ ...s.cardArrow, color: '#FFF' }}>›</span>
      </button>

      {pinFor !== null && (
        <div style={s.modalBackdrop}>
          <div style={{ ...s.modalCard, ...shadow.card }}>
            <p style={s.modalTitle}>{pinFor === 'admin' ? 'Admin PIN' : 'Staff PIN'}</p>
            <input
              style={s.pinInput}
              value={pin}
              onChange={e => setPin(e.target.value)}
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && tryPinLogin()}
            />
            <div style={s.modalRow}>
              <button style={s.modalCancel} onClick={() => { setPin(''); setPinFor(null); }}>
                <span style={s.modalCancelText}>Cancel</span>
              </button>
              <button style={s.modalOk} onClick={tryPinLogin}>
                <span style={s.modalOkText}>Enter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    backgroundColor: colors.qpNavy,
    padding: 24,
    justifyContent: 'center',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: { width: 130, height: 130, objectFit: 'contain', marginBottom: -8 },
  title: { fontSize: 36, fontWeight: 800, color: '#FFF', letterSpacing: 1, marginBottom: 4 },
  subtitle: { fontSize: 15, color: colors.qpMist, textAlign: 'center', lineHeight: '22px' },
  card: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 16,
    width: '100%',
    cursor: 'pointer',
    textAlign: 'left',
    border: 'none',
  },
  staffCard: { backgroundColor: colors.qpBlue },
  adminCard: {
    backgroundColor: colors.qpNavyDeep,
    border: '1px solid rgba(255,255,255,0.25)',
  },
  cardEmoji: { fontSize: 34, marginRight: 16, flexShrink: 0 },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 19, fontWeight: 700, color: colors.qpNavy },
  cardDesc: { fontSize: 14, color: '#5A6B96', marginTop: 2 },
  cardArrow: { fontSize: 30, color: colors.qpBlue, fontWeight: 600, flexShrink: 0 },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(8,17,45,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    zIndex: 100,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: radius.lg,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: colors.qpNavy, textAlign: 'center', marginBottom: 16 },
  pinInput: {
    display: 'block',
    width: '100%',
    border: `1px solid ${colors.line}`,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 8,
    color: colors.qpNavy,
    backgroundColor: '#F2F5FC',
  },
  modalRow: { display: 'flex', flexDirection: 'row', marginTop: 16, gap: 12 },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: radius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${colors.line}`,
    cursor: 'pointer',
    backgroundColor: 'transparent',
  },
  modalCancelText: { color: '#5A6B96', fontWeight: 600 },
  modalOk: {
    flex: 1,
    padding: 14,
    borderRadius: radius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.qpBlue,
    cursor: 'pointer',
  },
  modalOkText: { color: '#FFF', fontWeight: 700 },
};
