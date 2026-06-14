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
    if (!profile.approved) {
      showToast('Your profile is waiting for admin approval ⏳');
      return;
    }
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
    <div style={s.container}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}><span style={s.backText}>‹ Back</span></button>
        <span style={s.headerTitle}>Order</span>
        <div style={{ width: 60 }} />
      </div>

      <div style={s.scroll}>
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
          <button style={s.editBtn} onClick={onEditProfile}><span style={s.editBtnText}>Edit</span></button>
        </div>

        {/* Pending approval banner */}
        {!profile.approved && (
          <div style={s.pendingBanner}>
            <p style={s.pendingTitle}>⏳ Waiting for admin approval</p>
            <p style={s.pendingText}>An admin needs to approve your profile before you can place orders.</p>
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

        {/* Menu */}
        {MENU.map(section => (
          <div key={section.section}>
            <p style={s.sectionTitle}>{section.section}</p>
            <div style={s.grid}>
              {section.items.map(item => (
                <button
                  key={item.id}
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
          <div style={{ marginTop: 8 }}>
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

      {/* Toast */}
      {toast && (
        <div style={s.toast}><span style={s.toastText}>{toast}</span></div>
      )}

      {/* Order bottom sheet */}
      {selected && (
        <div style={s.modalBackdrop} onClick={() => setSelected(null)}>
          <div style={{ ...s.sheet, ...shadow.card }} onClick={e => e.stopPropagation()}>
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
              style={s.noteInput}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Note (optional) — e.g. less sugar"
            />

            <button style={s.sendBtn} onClick={submit}>
              <span style={s.sendBtnText}>Send request</span>
            </button>
            <button style={s.cancelBtn} onClick={() => setSelected(null)}>
              <span style={s.cancelBtnText}>Cancel</span>
            </button>
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
    height: '100dvh',
    backgroundColor: colors.cream,
    overflow: 'hidden',
  },
  header: {
    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
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
  scroll: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: 16,
  },
  profileCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    border: `1px solid ${colors.line}`,
    padding: 12,
  },
  avatar: { width: 50, height: 50, borderRadius: '50%', marginRight: 12, objectFit: 'cover', flexShrink: 0 },
  avatarFallback: { backgroundColor: colors.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: 16, fontWeight: 800, color: colors.espresso },
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
  editBtnText: { color: colors.caramel, fontWeight: 700, fontSize: 13 },
  pendingBanner: {
    backgroundColor: '#DCEAFB',
    borderRadius: radius.md,
    border: `1px solid ${colors.caramel}`,
    padding: 14,
    marginTop: 12,
  },
  pendingTitle: { fontWeight: 800, color: colors.espresso, marginBottom: 4 },
  pendingText: { color: colors.bean, fontSize: 13, lineHeight: '19px' },
  callBtn: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.caramel,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 12,
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
    padding: 14,
    marginTop: 12,
  },
  callEmoji: { fontSize: 28, marginRight: 12, flexShrink: 0 },
  callBtnTitle: { fontSize: 16, fontWeight: 800, color: colors.foam },
  callBannerTitle: { fontSize: 16, fontWeight: 800, color: colors.espresso },
  callBtnSub: { fontSize: 12, color: '#DCEAFB', marginTop: 2 },
  callBannerSub: { fontSize: 12, color: colors.latte, marginTop: 2 },
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
  sectionTitle: { fontSize: 17, fontWeight: 800, color: colors.espresso, marginTop: 18, marginBottom: 10 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  },
  itemCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    border: `1px solid ${colors.line}`,
    paddingTop: 18,
    paddingBottom: 18,
    cursor: 'pointer',
  },
  itemDisabled: { opacity: 0.45 },
  itemEmoji: { fontSize: 32, marginBottom: 6 },
  itemName: { fontSize: 14, fontWeight: 600, color: colors.espresso },
  reqRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    border: `1px solid ${colors.line}`,
    padding: 12,
    marginBottom: 10,
  },
  reqEmoji: { fontSize: 24, marginRight: 12, flexShrink: 0 },
  reqName: { fontSize: 15, fontWeight: 700, color: colors.espresso },
  reqTime: { fontSize: 12, color: colors.latte, marginTop: 2 },
  badge: { paddingLeft: 10, paddingRight: 10, paddingTop: 5, paddingBottom: 5, borderRadius: 999, flexShrink: 0 },
  badgePending: { backgroundColor: '#DCEAFB' },
  badgeServed: { backgroundColor: '#D9F0E3' },
  badgeText: { fontSize: 12, fontWeight: 700, color: colors.espresso },
  toast: {
    position: 'fixed',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: colors.espresso,
    borderRadius: radius.md,
    padding: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  toastText: { color: colors.foam, fontWeight: 600 },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(8,17,45,0.6)',
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 100,
  },
  sheet: {
    backgroundColor: colors.foam,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
  },
  sheetEmoji: { fontSize: 44 },
  sheetTitle: { fontSize: 22, fontWeight: 800, color: colors.espresso, marginTop: 6, marginBottom: 16 },
  qtyRow: { display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
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
    fontSize: 26,
    fontWeight: 800,
    color: colors.espresso,
    marginLeft: 26,
    marginRight: 26,
    minWidth: 36,
    textAlign: 'center',
  },
  noteInput: {
    alignSelf: 'stretch',
    backgroundColor: colors.cream,
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
    padding: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
  },
  sendBtnText: { color: colors.foam, fontSize: 17, fontWeight: 800 },
  cancelBtn: { padding: 14, backgroundColor: 'transparent', cursor: 'pointer' },
  cancelBtnText: { color: colors.latte, fontWeight: 600 },
};
