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
    <div style={s.page}>
      {/* Centered content column — max 460px on desktop, full width on mobile */}
      <div style={s.inner}>

        <div style={s.header}>
          <img src={logoUrl} style={s.logo} alt="BrewDesk" />
          <p style={s.title}>BrewDesk</p>
          <p style={s.subtitle}>Request coffee &amp; snacks. Staff serves them. Simple.</p>
        </div>

        <div style={s.cards}>
          <button className="role-card" style={{ ...s.card, ...shadow.card }} onClick={() => onPickRole('user')}>
            <span style={s.cardEmoji}>🙋</span>
            <div style={s.cardTextWrap}>
              <p style={s.cardTitle}>I want something</p>
              <p style={s.cardDesc}>Order coffee, tea or snacks</p>
            </div>
            <span style={s.cardArrow}>›</span>
          </button>

          <button className="role-card" style={{ ...s.card, ...s.staffCard, ...shadow.card }} onClick={() => setPinFor('staff')}>
            <span style={s.cardEmoji}>🧑‍🍳</span>
            <div style={s.cardTextWrap}>
              <p style={{ ...s.cardTitle, color: '#FFF' }}>Staff panel</p>
              <p style={{ ...s.cardDesc, color: 'rgba(255,255,255,0.75)' }}>See requests &amp; serve them</p>
            </div>
            <span style={{ ...s.cardArrow, color: '#FFF' }}>›</span>
          </button>

          <button className="role-card" style={{ ...s.card, ...s.adminCard, ...shadow.card }} onClick={() => setPinFor('admin')}>
            <span style={s.cardEmoji}>🛡️</span>
            <div style={s.cardTextWrap}>
              <p style={{ ...s.cardTitle, color: '#FFF' }}>Admin panel</p>
              <p style={{ ...s.cardDesc, color: 'rgba(255,255,255,0.75)' }}>Approve &amp; manage employee profiles</p>
            </div>
            <span style={{ ...s.cardArrow, color: '#FFF' }}>›</span>
          </button>
        </div>

        <p style={s.footer}>QuestionPro · Office App</p>
      </div>

      {/* PIN modal */}
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
  /* Full-viewport navy background, vertically + horizontally centers the inner column */
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100dvh',
    backgroundColor: colors.qpNavy,
    padding: '32px 20px',
  },

  /* Content column — constrained to 460px on desktop, full width on mobile */
  inner: {
    width: '100%',
    maxWidth: 460,
    display: 'flex',
    flexDirection: 'column',
  },

  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: { width: 110, height: 110, objectFit: 'contain', marginBottom: -4 },
  title: { fontSize: 34, fontWeight: 800, color: '#FFF', letterSpacing: 1, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.qpMist, textAlign: 'center', lineHeight: '20px', maxWidth: 300 },

  cards: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },

  card: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: radius.lg,
    padding: '18px 20px',
    width: '100%',
    cursor: 'pointer',
    textAlign: 'left',
    border: 'none',
  },
  staffCard: { backgroundColor: colors.qpBlue },
  adminCard: {
    backgroundColor: colors.qpNavyDeep,
    border: '1px solid rgba(255,255,255,0.2)',
  },

  cardEmoji: { fontSize: 32, marginRight: 16, flexShrink: 0 },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: 700, color: colors.qpNavy },
  cardDesc: { fontSize: 13, color: '#5A6B96', marginTop: 3 },
  cardArrow: { fontSize: 28, color: colors.qpBlue, fontWeight: 600, flexShrink: 0 },

  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(174,190,232,0.5)',
    marginTop: 28,
    letterSpacing: 0.5,
  },

  /* PIN modal */
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(8,17,45,0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 100,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: radius.lg,
    padding: 28,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.qpNavy,
    textAlign: 'center',
    marginBottom: 16,
  },
  pinInput: {
    display: 'block',
    width: '100%',
    border: `1px solid ${colors.line}`,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 10,
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
    border: 'none',
  },
  modalOkText: { color: '#FFF', fontWeight: 700 },
};
