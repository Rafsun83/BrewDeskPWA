import React, { useEffect, useState, useCallback } from 'react';
import { MENU } from '../data/menu.js';
import {
  addRequest, getRequests, getMyProfile,
  addCall, getCalls, deleteCall, timeAgo,
} from '../db.js';
import { colors, radius, shadow } from '../theme.js';

export default function OrderScreen({ profile: initialProfile, onBack, onEditProfile, onProfileGone }) {
  const [profile, setProfile] = useState(initialProfile);
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [myCall, setMyCall] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const loadMine = useCallback(async () => {
    const all = await getRequests();
    setMyRequests(all.filter(r => r.requesterId === initialProfile.employeeId).slice(0, 10));
    const calls = await getCalls();
    const active = calls.find(c =>
      c.callerId === initialProfile.employeeId &&
      (c.status === 'pending' || c.status === 'coming')
    );
    setMyCall(active || null);
  }, [initialProfile.employeeId]);

  useEffect(() => {
    loadMine();
    const t = setInterval(async () => {
      loadMine();
      try {
        const fresh = await getMyProfile();
        if (!fresh) { onProfileGone(); return; }
        setProfile(fresh);
      } catch (e) { /* offline — keep current profile */ }
    }, 4000);
    return () => clearInterval(t);
  }, [loadMine, onProfileGone]);

  const openItem = (item) => {
    if (!profile.approved) { showToast('Your profile is waiting for admin approval ⏳'); return; }
    setSelected(item);
    setQty(1);
    setNote('');
  };

  const submit = async () => {
    try {
      await addRequest({
        itemId: selected.id,
        itemName: selected.name,
        emoji: selected.emoji,
        qty,
        note: note.trim(),
        requester: profile.name,
        requesterId: profile.employeeId,
      });
    } catch (e) {
      showToast('Could not send — check your internet connection ❌');
      return;
    }
    const item = selected;
    setSelected(null);
    showToast(`Request sent: ${qty} × ${item.name} ✅`);
    loadMine();
  };

  const callStaff = async () => {
    if (!profile.approved) { showToast('Your profile is waiting for admin approval ⏳'); return; }
    try {
      await addCall({ callerName: profile.name, callerId: profile.employeeId });
    } catch (e) {
      showToast('Could not send — check your internet connection ❌');
      return;
    }
    showToast('Staff has been called 🔔');
    loadMine();
  };

  const cancelCall = async () => {
    if (!myCall) return;
    try { await deleteCall(myCall.id); } catch (e) {
      showToast('Could not cancel — check your internet connection ❌');
      return;
    }
    setMyCall(null);
    loadMine();
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}><span style={s.backText}>‹ Back</span></button>
        <span style={s.headerTitle}>Order</span>
        <div style={{ width: 60 }} />
      </div>

      {/* Scrollable body — content centered at max 720px */}
      <div style={s.body}>
        <div style={s.content}>

          {/* Profile card */}
          <div style={{ ...s.profileCard, ...shadow.card }}>
            {profile.photo
              ? <img src={profile.photo} style={s.avatar} alt={profile.name} />
              : <div style={{ ...s.avatar, ...s.avatarFallback }}><span style={{ fontSize: 22 }}>🙂</span></div>
            }
            <div style={{ flex: 1 }}>
              <p style={s.profileName}>{profile.name}</p>
              <p style={s.profileMeta}>{profile.employeeId}</p>
            </div>
            <button style={s.editBtn} onClick={onEditProfile}>
              <span style={s.editBtnText}>✏️ Edit</span>
            </button>
          </div>

          {/* Pending approval banner */}
          {!profile.approved && (
            <div style={s.pendingBanner}>
              <span style={s.pendingIcon}>⏳</span>
              <div>
                <p style={s.pendingTitle}>Waiting for admin approval</p>
                <p style={s.pendingText}>An admin needs to approve your profile before you can place orders.</p>
              </div>
            </div>
          )}

          {/* Call staff */}
          {profile.approved && (
            !myCall ? (
              <button style={{ ...s.callBtn, ...shadow.card }} onClick={callStaff}>
                <span style={s.callEmoji}>🔔</span>
                <div style={{ flex: 1 }}>
                  <p style={s.callBtnTitle}>Call staff to my desk</p>
                  <p style={s.callBtnSub}>No order needed — staff gets notified right away</p>
                </div>
                <span style={s.callBtnArrow}>›</span>
              </button>
            ) : (
              <div style={{ ...s.callBanner, ...shadow.card }}>
                <span style={s.callEmoji}>{myCall.status === 'coming' ? '👋' : '🔔'}</span>
                <div style={{ flex: 1 }}>
                  <p style={s.callBannerTitle}>
                    {myCall.status === 'coming' ? 'Staff is on the way!' : 'Calling staff…'}
                  </p>
                  <p style={s.callBannerSub}>
                    {myCall.status === 'coming'
                      ? 'They saw your call and are coming over.'
                      : `Sent ${timeAgo(myCall.createdAt)} — waiting for a response.`}
                  </p>
                </div>
                {myCall.status === 'pending' && (
                  <button style={s.callCancelBtn} onClick={cancelCall}>
                    <span style={s.callCancelText}>Cancel</span>
                  </button>
                )}
              </div>
            )
          )}

          {/* Menu sections */}
          {MENU.map(section => (
            <div key={section.section}>
              <div style={s.sectionHeader}>
                <p style={s.sectionTitle}>{section.section}</p>
                <span style={s.sectionCount}>{section.items.length} items</span>
              </div>
              {/* CSS class handles responsive columns */}
              <div className="menu-grid">
                {section.items.map(item => (
                  <button
                    key={item.id}
                    className="menu-item-card"
                    style={{ ...s.itemCard, ...shadow.card, ...(!profile.approved ? s.itemDisabled : {}) }}
                    onClick={() => openItem(item)}
                  >
                    <span style={s.itemEmoji}>{item.emoji}</span>
                    <span style={s.itemName}>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* My recent requests */}
          {myRequests.length > 0 && (
            <div style={s.requestsSection}>
              <p style={s.sectionTitle}>My recent requests</p>
              {myRequests.map(r => (
                <div key={r.id} style={{ ...s.reqRow, ...shadow.card }}>
                  <span style={s.reqEmoji}>{r.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={s.reqName}>{r.qty} × {r.itemName}</p>
                    <p style={s.reqTime}>{timeAgo(r.createdAt)}</p>
                  </div>
                  <div style={{ ...s.badge, ...(r.status === 'served' ? s.badgeServed : s.badgePending) }}>
                    <span style={s.badgeText}>{r.status === 'served' ? 'Served ✓' : 'Pending'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ height: 40 }} />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={s.toast}><span style={s.toastText}>{toast}</span></div>
      )}

      {/* Order modal — bottom sheet on mobile, centered dialog on desktop (via CSS) */}
      {selected && (
        <div className="order-backdrop" onClick={() => setSelected(null)}>
          <div className="order-sheet" onClick={e => e.stopPropagation()}>
            <span style={s.sheetEmoji}>{selected.emoji}</span>
            <p style={s.sheetTitle}>{selected.name}</p>

            <div style={s.qtyRow}>
              <button style={s.qtyBtn} onClick={() => setQty(Math.max(1, qty - 1))}>
                <span style={s.qtyBtnText}>−</span>
              </button>
              <span style={s.qtyValue}>{qty}</span>
              <button style={s.qtyBtn} onClick={() => setQty(Math.min(20, qty + 1))}>
                <span style={s.qtyBtnText}>+</span>
              </button>
            </div>

            <input
              className="brew-input"
              style={s.noteInput}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Note (optional) — e.g. less sugar"
            />

            <button style={s.sendBtn} onClick={submit}>
              <span style={s.sendBtnText}>☕ Send request</span>
            </button>
            <button style={s.cancelModalBtn} onClick={() => setSelected(null)}>
              <span style={s.cancelModalText}>Cancel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    backgroundColor: colors.cream,
    overflow: 'hidden',
  },

  /* Header */
  header: {
    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)',
    paddingBottom: 14,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: colors.espresso,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  backBtn: { width: 60, textAlign: 'left', backgroundColor: 'transparent' },
  backText: { color: colors.caramel, fontSize: 17, fontWeight: 600 },
  headerTitle: { color: colors.foam, fontSize: 19, fontWeight: 700 },

  /* Scrollable body */
  body: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    display: 'flex',
    justifyContent: 'center',
  },

  /* Centered content column */
  content: {
    width: '100%',
    maxWidth: 720,
    padding: '16px 16px 0',
  },

  /* Profile card */
  profileCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    border: `1px solid ${colors.line}`,
    padding: '12px 16px',
    marginBottom: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: '50%', marginRight: 12, objectFit: 'cover', flexShrink: 0 },
  avatarFallback: { backgroundColor: colors.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: 15, fontWeight: 800, color: colors.espresso },
  profileMeta: { fontSize: 12, color: colors.latte, marginTop: 2 },
  editBtn: {
    border: `1px solid ${colors.line}`,
    borderRadius: 999,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 7,
    paddingBottom: 7,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    flexShrink: 0,
  },
  editBtnText: { color: colors.caramel, fontWeight: 700, fontSize: 12 },

  /* Pending banner */
  pendingBanner: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#DCEAFB',
    borderRadius: radius.md,
    border: `1px solid ${colors.caramel}`,
    padding: '14px 16px',
    marginBottom: 12,
  },
  pendingIcon: { fontSize: 20, flexShrink: 0, marginTop: 1 },
  pendingTitle: { fontWeight: 800, color: colors.espresso, marginBottom: 3, fontSize: 14 },
  pendingText: { color: colors.bean, fontSize: 13, lineHeight: '18px' },

  /* Call staff */
  callBtn: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.caramel,
    borderRadius: radius.md,
    padding: '14px 16px',
    marginBottom: 12,
    width: '100%',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  callBanner: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    border: `1.5px solid ${colors.caramel}`,
    padding: '14px 16px',
    marginBottom: 12,
  },
  callEmoji: { fontSize: 26, marginRight: 12, flexShrink: 0 },
  callBtnTitle: { fontSize: 15, fontWeight: 800, color: colors.foam },
  callBannerTitle: { fontSize: 15, fontWeight: 800, color: colors.espresso },
  callBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  callBannerSub: { fontSize: 12, color: colors.latte, marginTop: 2 },
  callBtnArrow: { fontSize: 24, color: 'rgba(255,255,255,0.7)', fontWeight: 600, flexShrink: 0 },
  callCancelBtn: {
    border: `1px solid ${colors.line}`,
    borderRadius: 999,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 7,
    paddingBottom: 7,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    flexShrink: 0,
  },
  callCancelText: { color: colors.berry, fontWeight: 700, fontSize: 13 },

  /* Section headers */
  sectionHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: 800, color: colors.espresso },
  sectionCount: { fontSize: 12, color: colors.latte, fontWeight: 600 },

  /* Menu item cards */
  itemCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    border: `1px solid ${colors.line}`,
    paddingTop: 20,
    paddingBottom: 16,
    paddingLeft: 8,
    paddingRight: 8,
    cursor: 'pointer',
    gap: 8,
  },
  itemDisabled: { opacity: 0.4, pointerEvents: 'none' },
  itemEmoji: { fontSize: 34 },
  itemName: { fontSize: 13, fontWeight: 600, color: colors.espresso, textAlign: 'center', lineHeight: '18px' },

  /* Recent requests */
  requestsSection: { marginTop: 8 },
  reqRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    border: `1px solid ${colors.line}`,
    padding: '12px 14px',
    marginBottom: 10,
  },
  reqEmoji: { fontSize: 24, marginRight: 12, flexShrink: 0 },
  reqName: { fontSize: 14, fontWeight: 700, color: colors.espresso },
  reqTime: { fontSize: 12, color: colors.latte, marginTop: 2 },
  badge: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 999,
    flexShrink: 0,
  },
  badgePending: { backgroundColor: '#DCEAFB' },
  badgeServed: { backgroundColor: '#D9F0E3' },
  badgeText: { fontSize: 12, fontWeight: 700, color: colors.espresso },

  /* Toast */
  toast: {
    position: 'fixed',
    bottom: 28,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: colors.espresso,
    borderRadius: radius.md,
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 16px rgba(19,38,95,0.25)',
  },
  toastText: { color: colors.foam, fontWeight: 600, fontSize: 14 },

  /* Order modal (sheet styles used as CSS class fallback base) */
  sheetEmoji: { fontSize: 48, marginBottom: 4 },
  sheetTitle: { fontSize: 22, fontWeight: 800, color: colors.espresso, marginBottom: 20 },
  qtyRow: { display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  qtyBtn: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    backgroundColor: colors.cream,
    border: `1px solid ${colors.line}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  qtyBtnText: { fontSize: 26, color: colors.espresso, fontWeight: 600, lineHeight: 1 },
  qtyValue: {
    fontSize: 28,
    fontWeight: 800,
    color: colors.espresso,
    marginLeft: 28,
    marginRight: 28,
    minWidth: 36,
    textAlign: 'center',
  },
  noteInput: {
    alignSelf: 'stretch',
    backgroundColor: '#FAFBFF',
    border: `1px solid ${colors.line}`,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 15,
    color: colors.espresso,
    marginBottom: 16,
  },
  sendBtn: {
    alignSelf: 'stretch',
    backgroundColor: colors.caramel,
    borderRadius: radius.md,
    padding: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
    boxShadow: '0 4px 14px rgba(27,135,230,0.35)',
  },
  sendBtnText: { color: colors.foam, fontSize: 16, fontWeight: 800 },
  cancelModalBtn: {
    padding: '12px 0 0',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    border: 'none',
  },
  cancelModalText: { color: colors.latte, fontWeight: 600, fontSize: 14 },
};
