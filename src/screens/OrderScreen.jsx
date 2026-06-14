import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { MENU } from '../data/menu.js';
import {
  addRequest, getRequests, getMyProfile,
  addCall, getCalls, deleteCall, timeAgo,
} from '../db.js';
import { colors, radius, shadow } from '../theme.js';

// Flat lookup: itemId → item metadata (health, cal, emoji, name)
const ITEM_MAP = {};
MENU.forEach(s => s.items.forEach(item => { ITEM_MAP[item.id] = item; }));

const HEALTH_COLOR = { good: '#2F9E63', moderate: '#E8A020', bad: '#D6493E' };
const HEALTH_BG    = { good: '#EDFBF3', moderate: '#FFF8EC', bad: '#FFF0EF' };
const HEALTH_ICON  = { good: '💚', moderate: '🟡', bad: '🔴' };
const HEALTH_LABEL = { good: 'Healthy', moderate: 'Moderate', bad: 'Unhealthy' };

// ── Health ring (SVG) ─────────────────────────────────────────────────────────
function HealthRing({ score }) {
  const R = 52, C = 2 * Math.PI * R;
  const offset = C - (score / 100) * C;
  const color = score >= 70 ? HEALTH_COLOR.good : score >= 45 ? HEALTH_COLOR.moderate : HEALTH_COLOR.bad;
  return (
    <svg width="136" height="136" viewBox="0 0 136 136" style={{ flexShrink: 0 }}>
      <circle cx="68" cy="68" r={R} fill="none" stroke="#EEF3FB" strokeWidth="13" />
      <circle
        cx="68" cy="68" r={R} fill="none"
        stroke={color} strokeWidth="13"
        strokeDasharray={`${C}`}
        strokeDashoffset={`${offset}`}
        strokeLinecap="round"
        transform="rotate(-90 68 68)"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x="68" y="62" textAnchor="middle" dominantBaseline="middle"
        fill={colors.espresso} fontSize="26" fontWeight="800" fontFamily="system-ui,sans-serif">
        {score}%
      </text>
      <text x="68" y="82" textAnchor="middle" dominantBaseline="middle"
        fill={colors.latte} fontSize="11" fontFamily="system-ui,sans-serif">
        Healthy
      </text>
    </svg>
  );
}

// ── Horizontal bar row ────────────────────────────────────────────────────────
function HealthBar({ item, maxCount }) {
  const pct = Math.max(5, Math.round((item.count / maxCount) * 100));
  const hc = HEALTH_COLOR[item.health] || HEALTH_COLOR.moderate;
  return (
    <div style={bs.row}>
      <span style={bs.emoji}>{item.emoji}</span>
      <span style={bs.label}>{item.name}</span>
      <div style={bs.track}>
        <div style={{ ...bs.fill, width: `${pct}%`, backgroundColor: hc }} />
      </div>
      <span style={bs.count}>{item.count}</span>
      <span style={bs.icon}>{HEALTH_ICON[item.health]}</span>
    </div>
  );
}
const bs = {
  row:   { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  emoji: { fontSize: 17, flexShrink: 0, width: 22, textAlign: 'center' },
  label: { fontSize: 12, color: colors.espresso, fontWeight: 600, width: 108, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  track: { flex: 1, height: 10, backgroundColor: '#EEF3FB', borderRadius: 999 },
  fill:  { height: '100%', borderRadius: 999, transition: 'width 0.7s ease' },
  count: { fontSize: 12, color: colors.latte, fontWeight: 700, minWidth: 24, textAlign: 'right', flexShrink: 0 },
  icon:  { fontSize: 12, flexShrink: 0 },
};

// ── Main screen ───────────────────────────────────────────────────────────────
export default function OrderScreen({ profile: initialProfile, onBack, onEditProfile, onProfileGone }) {
  const [profile, setProfile] = useState(initialProfile);
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [myOrderHistory, setMyOrderHistory] = useState([]);
  const [myCall, setMyCall] = useState(null);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState('menu');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const loadMine = useCallback(async () => {
    const all = await getRequests();
    const mine = all.filter(r => r.requesterId === initialProfile.employeeId);
    setMyRequests(mine.slice(0, 10));
    setMyOrderHistory(mine);
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

  // ── Health stats derived from full order history ────────────────────────────
  const healthStats = useMemo(() => {
    if (!myOrderHistory.length) return null;
    const counts = {};
    let totalQty = 0, goodQty = 0, modQty = 0, badQty = 0;
    myOrderHistory.forEach(r => {
      const meta = ITEM_MAP[r.itemId];
      if (!meta) return;
      if (!counts[r.itemId]) counts[r.itemId] = { ...meta, count: 0 };
      counts[r.itemId].count += (r.qty || 1);
      totalQty += (r.qty || 1);
      if (meta.health === 'good')     goodQty += (r.qty || 1);
      else if (meta.health === 'moderate') modQty += (r.qty || 1);
      else                            badQty  += (r.qty || 1);
    });
    const topItems = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 8);
    const score = totalQty > 0 ? Math.round((goodQty / totalQty) * 100) : 0;
    const topBad  = topItems.find(i => i.health === 'bad');
    const topGood = topItems.find(i => i.health === 'good');
    let tip = null;
    if (score >= 70 && topGood)
      tip = `💚 ${topGood.name} is your top healthy pick — keep it up!`;
    else if (topBad && topBad.count >= 3) {
      const alt = topItems.find(i => i.health === 'good');
      tip = `⚠️ You've ordered ${topBad.name} ${topBad.count}× — try swapping for ${alt ? alt.name : 'a healthier option'}!`;
    } else if (score < 45)
      tip = '🥗 Your mix is quite heavy. Adding Green Tea or Fruits helps!';
    return { topItems, score, totalQty, goodQty, modQty, badQty, tip };
  }, [myOrderHistory]);

  const openItem = (item) => {
    if (!profile.approved) { showToast('Your profile is waiting for admin approval ⏳'); return; }
    setSelected(item);
    setQty(1);
    setNote('');
  };

  const submit = async () => {
    try {
      await addRequest({
        itemId: selected.id, itemName: selected.name, emoji: selected.emoji,
        qty, note: note.trim(), requester: profile.name, requesterId: profile.employeeId,
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
    try { await addCall({ callerName: profile.name, callerId: profile.employeeId }); }
    catch (e) { showToast('Could not send — check your internet connection ❌'); return; }
    showToast('Staff has been called 🔔');
    loadMine();
  };

  const cancelCall = async () => {
    if (!myCall) return;
    try { await deleteCall(myCall.id); }
    catch (e) { showToast('Could not cancel — check your internet connection ❌'); return; }
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

      {/* Tab bar */}
      <div style={s.tabBar}>
        <button
          style={{ ...s.tab, ...(activeTab === 'menu' ? s.tabActive : {}) }}
          onClick={() => setActiveTab('menu')}
        >
          ☕ Menu
        </button>
        <button
          style={{ ...s.tab, ...(activeTab === 'health' ? s.tabActive : {}) }}
          onClick={() => setActiveTab('health')}
        >
          Health Insights
          {healthStats && (
            <span style={{
              ...s.tabBadge,
              backgroundColor: healthStats.score >= 70 ? '#EDFBF3' : healthStats.score >= 45 ? '#FFF8EC' : '#FFF0EF',
              color: healthStats.score >= 70 ? HEALTH_COLOR.good : healthStats.score >= 45 ? HEALTH_COLOR.moderate : HEALTH_COLOR.bad,
            }}>
              {healthStats.score}%
            </span>
          )}
        </button>
      </div>

      {/* ── MENU TAB ─────────────────────────────────────────────────────────── */}
      {activeTab === 'menu' && (
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
                      {/* Small health dot on each card */}
                      <span style={{
                        ...s.itemHealthDot,
                        backgroundColor: HEALTH_COLOR[item.health] || HEALTH_COLOR.moderate,
                      }} />
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
      )}

      {/* ── HEALTH TAB ───────────────────────────────────────────────────────── */}
      {activeTab === 'health' && (
        <div style={s.body}>
          <div style={s.content}>

            {!healthStats ? (
              /* Empty state */
              <div style={s.healthEmpty}>
                <span style={s.healthEmptyEmoji}>📊</span>
                <p style={s.healthEmptyTitle}>No order history yet</p>
                <p style={s.healthEmptyDesc}>
                  Place a few orders from the Menu tab and your health insights will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Score card */}
                <div style={{ ...s.scoreCard, ...shadow.card }}>
                  <p style={s.scoreCardTitle}>Overall Health Score</p>
                  <div style={s.scoreCardBody}>
                    <HealthRing score={healthStats.score} />
                    <div style={s.scoreRight}>
                      <p style={s.scoreBig}>
                        <span style={{ color: healthStats.score >= 70 ? HEALTH_COLOR.good : healthStats.score >= 45 ? HEALTH_COLOR.moderate : HEALTH_COLOR.bad }}>
                          {healthStats.score >= 70 ? 'Great' : healthStats.score >= 45 ? 'Fair' : 'Poor'}
                        </span>
                      </p>
                      <p style={s.scoreSub}>{healthStats.totalQty} total orders analysed</p>
                      {/* Legend pills */}
                      <div style={s.legendRow}>
                        {[
                          { key: 'good',     qty: healthStats.goodQty },
                          { key: 'moderate', qty: healthStats.modQty  },
                          { key: 'bad',      qty: healthStats.badQty  },
                        ].map(({ key, qty }) => (
                          <div key={key} style={{ ...s.legendPill, backgroundColor: HEALTH_BG[key] }}>
                            <span style={{ ...s.legendDot, backgroundColor: HEALTH_COLOR[key] }} />
                            <span style={{ ...s.legendText, color: HEALTH_COLOR[key] }}>
                              {HEALTH_LABEL[key]} {qty}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tip */}
                {healthStats.tip && (
                  <div style={{ ...s.tipCard, ...shadow.card }}>
                    <p style={s.tipText}>{healthStats.tip}</p>
                  </div>
                )}

                {/* Bar chart */}
                <div style={{ ...s.chartCard, ...shadow.card }}>
                  <div style={s.chartHeader}>
                    <p style={s.chartTitle}>Your most ordered items</p>
                    <div style={s.chartLegend}>
                      {['good', 'moderate', 'bad'].map(k => (
                        <span key={k} style={s.chartLegendItem}>
                          <span style={{ ...s.chartLegendDot, backgroundColor: HEALTH_COLOR[k] }} />
                          <span style={s.chartLegendLabel}>{HEALTH_LABEL[k]}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  {healthStats.topItems.map(item => (
                    <HealthBar key={item.id} item={item} maxCount={healthStats.topItems[0].count} />
                  ))}
                </div>

                {/* Per-category summary */}
                <div style={s.catRow}>
                  {[
                    { key: 'good',     label: '💚 Healthy',    qty: healthStats.goodQty },
                    { key: 'moderate', label: '🟡 Moderate',   qty: healthStats.modQty  },
                    { key: 'bad',      label: '🔴 Unhealthy',  qty: healthStats.badQty  },
                  ].map(({ key, label, qty }) => (
                    <div key={key} style={{ ...s.catBox, ...shadow.card, backgroundColor: HEALTH_BG[key], border: `1px solid ${HEALTH_COLOR[key]}30` }}>
                      <span style={{ ...s.catNum, color: HEALTH_COLOR[key] }}>{qty}</span>
                      <span style={s.catLabel}>{label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ height: 40 }} />
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={s.toast}><span style={s.toastText}>{toast}</span></div>
      )}

      {/* Order modal */}
      {selected && (
        <div className="order-backdrop" onClick={() => setSelected(null)}>
          <div className="order-sheet" onClick={e => e.stopPropagation()}>
            <span style={s.sheetEmoji}>{selected.emoji}</span>
            <p style={s.sheetTitle}>{selected.name}</p>
            {/* Health badge in modal */}
            <div style={{
              ...s.sheetHealthBadge,
              backgroundColor: HEALTH_BG[selected.health],
              border: `1px solid ${HEALTH_COLOR[selected.health]}40`,
            }}>
              <span style={{ fontSize: 12 }}>{HEALTH_ICON[selected.health]}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: HEALTH_COLOR[selected.health], marginLeft: 4 }}>
                {HEALTH_LABEL[selected.health]}
              </span>
              {selected.cal > 0 && (
                <span style={{ fontSize: 11, color: colors.latte, marginLeft: 6 }}>~{selected.cal} kcal</span>
              )}
            </div>

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

  /* Tab bar */
  tabBar: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: colors.foam,
    borderBottom: `1px solid ${colors.line}`,
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '12px 0',
    fontSize: 13,
    fontWeight: 600,
    color: colors.latte,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    transition: 'color 0.15s ease, border-color 0.15s ease',
  },
  tabActive: {
    color: colors.caramel,
    borderBottomColor: colors.caramel,
    fontWeight: 700,
  },
  tabBadge: {
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 999,
    paddingLeft: 7,
    paddingRight: 7,
    paddingTop: 2,
    paddingBottom: 2,
  },

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
    paddingLeft: 14, paddingRight: 14, paddingTop: 7, paddingBottom: 7,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    flexShrink: 0,
  },
  editBtnText: { color: colors.caramel, fontWeight: 700, fontSize: 12 },

  /* Pending banner */
  pendingBanner: {
    display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#DCEAFB', borderRadius: radius.md,
    border: `1px solid ${colors.caramel}`,
    padding: '14px 16px', marginBottom: 12,
  },
  pendingIcon: { fontSize: 20, flexShrink: 0, marginTop: 1 },
  pendingTitle: { fontWeight: 800, color: colors.espresso, marginBottom: 3, fontSize: 14 },
  pendingText: { color: colors.bean, fontSize: 13, lineHeight: '18px' },

  /* Call staff */
  callBtn: {
    display: 'flex', flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.caramel, borderRadius: radius.md,
    padding: '14px 16px', marginBottom: 12,
    width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
  },
  callBanner: {
    display: 'flex', flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.foam, borderRadius: radius.md,
    border: `1.5px solid ${colors.caramel}`,
    padding: '14px 16px', marginBottom: 12,
  },
  callEmoji: { fontSize: 26, marginRight: 12, flexShrink: 0 },
  callBtnTitle: { fontSize: 15, fontWeight: 800, color: colors.foam },
  callBannerTitle: { fontSize: 15, fontWeight: 800, color: colors.espresso },
  callBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  callBannerSub: { fontSize: 12, color: colors.latte, marginTop: 2 },
  callBtnArrow: { fontSize: 24, color: 'rgba(255,255,255,0.7)', fontWeight: 600, flexShrink: 0 },
  callCancelBtn: {
    border: `1px solid ${colors.line}`, borderRadius: 999,
    paddingLeft: 14, paddingRight: 14, paddingTop: 7, paddingBottom: 7,
    backgroundColor: 'transparent', cursor: 'pointer', flexShrink: 0,
  },
  callCancelText: { color: colors.berry, fontWeight: 700, fontSize: 13 },

  /* Section headers */
  sectionHeader: {
    display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: 8,
    marginTop: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: 800, color: colors.espresso },
  sectionCount: { fontSize: 12, color: colors.latte, fontWeight: 600 },

  /* Menu item cards */
  itemCard: {
    position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.foam, borderRadius: radius.md,
    border: `1px solid ${colors.line}`,
    paddingTop: 20, paddingBottom: 16, paddingLeft: 8, paddingRight: 8,
    cursor: 'pointer', gap: 8,
  },
  itemDisabled: { opacity: 0.4, pointerEvents: 'none' },
  itemEmoji: { fontSize: 34 },
  itemName: { fontSize: 13, fontWeight: 600, color: colors.espresso, textAlign: 'center', lineHeight: '18px' },
  itemHealthDot: {
    position: 'absolute', top: 8, right: 8,
    width: 7, height: 7, borderRadius: '50%',
  },

  /* Recent requests */
  requestsSection: { marginTop: 8 },
  reqRow: {
    display: 'flex', flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.foam, borderRadius: radius.md,
    border: `1px solid ${colors.line}`,
    padding: '12px 14px', marginBottom: 10,
  },
  reqEmoji: { fontSize: 24, marginRight: 12, flexShrink: 0 },
  reqName: { fontSize: 14, fontWeight: 700, color: colors.espresso },
  reqTime: { fontSize: 12, color: colors.latte, marginTop: 2 },
  badge: { paddingLeft: 10, paddingRight: 10, paddingTop: 5, paddingBottom: 5, borderRadius: 999, flexShrink: 0 },
  badgePending: { backgroundColor: '#DCEAFB' },
  badgeServed: { backgroundColor: '#D9F0E3' },
  badgeText: { fontSize: 12, fontWeight: 700, color: colors.espresso },

  /* ── Health tab ─────────────────────────────────────────────────────────── */
  healthEmpty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    marginTop: 80, paddingLeft: 24, paddingRight: 24,
  },
  healthEmptyEmoji: { fontSize: 52, marginBottom: 12 },
  healthEmptyTitle: { fontSize: 17, fontWeight: 700, color: colors.espresso, marginBottom: 8 },
  healthEmptyDesc: { fontSize: 14, color: colors.latte, textAlign: 'center', lineHeight: '22px', maxWidth: 300 },

  /* Score card */
  scoreCard: {
    backgroundColor: colors.foam,
    borderRadius: radius.lg,
    border: `1px solid ${colors.line}`,
    padding: '20px 20px 16px',
    marginBottom: 14,
  },
  scoreCardTitle: { fontSize: 13, fontWeight: 700, color: colors.latte, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 16 },
  scoreCardBody: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 20 },
  scoreRight: { flex: 1 },
  scoreBig: { fontSize: 26, fontWeight: 800, marginBottom: 4 },
  scoreSub: { fontSize: 12, color: colors.latte, marginBottom: 14 },
  legendRow: { display: 'flex', flexDirection: 'column', gap: 6 },
  legendPill: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    borderRadius: 999, paddingLeft: 10, paddingRight: 10, paddingTop: 4, paddingBottom: 4,
    alignSelf: 'flex-start',
  },
  legendDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  legendText: { fontSize: 12, fontWeight: 700 },

  /* Tip */
  tipCard: {
    backgroundColor: '#FFFBEC',
    borderRadius: radius.md,
    border: `1px solid #FFE88A`,
    padding: '14px 16px',
    marginBottom: 14,
  },
  tipText: { fontSize: 13, color: '#7A5800', fontWeight: 600, lineHeight: '20px' },

  /* Bar chart card */
  chartCard: {
    backgroundColor: colors.foam,
    borderRadius: radius.lg,
    border: `1px solid ${colors.line}`,
    padding: '18px 18px 10px',
    marginBottom: 14,
  },
  chartHeader: { display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  chartTitle: { fontSize: 14, fontWeight: 700, color: colors.espresso },
  chartLegend: { display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chartLegendItem: { display: 'flex', alignItems: 'center', gap: 4 },
  chartLegendDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  chartLegendLabel: { fontSize: 10, color: colors.latte, fontWeight: 600 },

  /* Category summary row */
  catRow: { display: 'flex', flexDirection: 'row', gap: 10, marginBottom: 14 },
  catBox: {
    flex: 1, borderRadius: radius.md, padding: '12px 8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
  },
  catNum: { fontSize: 22, fontWeight: 800 },
  catLabel: { fontSize: 11, color: colors.latte, fontWeight: 600, textAlign: 'center' },

  /* Toast */
  toast: {
    position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
    backgroundColor: colors.espresso, borderRadius: radius.md,
    padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, whiteSpace: 'nowrap',
    boxShadow: '0 4px 16px rgba(19,38,95,0.25)',
  },
  toastText: { color: colors.foam, fontWeight: 600, fontSize: 14 },

  /* Order modal */
  sheetEmoji: { fontSize: 48, marginBottom: 4 },
  sheetTitle: { fontSize: 22, fontWeight: 800, color: colors.espresso, marginBottom: 10 },
  sheetHealthBadge: {
    display: 'inline-flex', alignItems: 'center',
    borderRadius: 999, paddingLeft: 12, paddingRight: 12, paddingTop: 5, paddingBottom: 5,
    marginBottom: 16,
  },
  qtyRow: { display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  qtyBtn: {
    width: 48, height: 48, borderRadius: '50%',
    backgroundColor: colors.cream, border: `1px solid ${colors.line}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
  },
  qtyBtnText: { fontSize: 26, color: colors.espresso, fontWeight: 600, lineHeight: 1 },
  qtyValue: {
    fontSize: 28, fontWeight: 800, color: colors.espresso,
    marginLeft: 28, marginRight: 28, minWidth: 36, textAlign: 'center',
  },
  noteInput: {
    alignSelf: 'stretch', backgroundColor: '#FAFBFF',
    border: `1px solid ${colors.line}`, borderRadius: radius.md,
    padding: 14, fontSize: 15, color: colors.espresso, marginBottom: 16,
  },
  sendBtn: {
    alignSelf: 'stretch', backgroundColor: colors.caramel, borderRadius: radius.md,
    padding: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', border: 'none',
    boxShadow: '0 4px 14px rgba(27,135,230,0.35)',
  },
  sendBtnText: { color: colors.foam, fontSize: 16, fontWeight: 800 },
  cancelModalBtn: { padding: '12px 0 0', backgroundColor: 'transparent', cursor: 'pointer', border: 'none' },
  cancelModalText: { color: colors.latte, fontWeight: 600, fontSize: 14 },
};
