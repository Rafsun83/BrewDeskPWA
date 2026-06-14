import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  getRequests, getEmployees, markServed, clearServed, deleteRequest,
  getCalls, setCallStatus, deleteCall, timeAgo,
} from '../db.js';
import { initStaffAlerts, alertNewRequests, alertNewCalls } from '../notify.js';
import { colors, radius, shadow } from '../theme.js';

export default function StaffScreen({ onBack }) {
  const [pending, setPending] = useState([]);
  const [served, setServed] = useState([]);
  const [calls, setCalls] = useState([]);
  const [showServed, setShowServed] = useState(false);
  const [photos, setPhotos] = useState({});
  const seenIds = useRef(null);
  const seenCallIds = useRef(null);

  const load = useCallback(async () => {
    const [all, allCalls] = await Promise.all([getRequests(), getCalls()]);
    const pendingNow = all
      .filter(r => r.status === 'pending')
      .sort((a, b) => a.createdAt - b.createdAt);
    setPending(pendingNow);
    setServed(all.filter(r => r.status === 'served'));

    const activeCalls = allCalls
      .filter(c => c.status === 'pending' || c.status === 'coming')
      .sort((a, b) => a.createdAt - b.createdAt);
    setCalls(activeCalls);

    if (seenIds.current === null) {
      seenIds.current = new Set(all.map(r => r.id));
      seenCallIds.current = new Set(allCalls.map(c => c.id));
      return;
    }
    const fresh = pendingNow.filter(r => !seenIds.current.has(r.id));
    all.forEach(r => seenIds.current.add(r.id));
    if (fresh.length > 0) alertNewRequests(fresh);

    const freshCalls = activeCalls.filter(c => !seenCallIds.current.has(c.id));
    allCalls.forEach(c => seenCallIds.current.add(c.id));
    if (freshCalls.length > 0) alertNewCalls(freshCalls);
  }, []);

  const loadPhotos = useCallback(async () => {
    try {
      const employees = await getEmployees();
      const map = {};
      employees.forEach(e => { if (e.photo) map[e.employeeId] = e.photo; });
      setPhotos(map);
    } catch (e) { /* offline */ }
  }, []);

  useEffect(() => {
    initStaffAlerts();
    load();
    loadPhotos();
    const t  = setInterval(load, 3000);
    const tp = setInterval(loadPhotos, 60000);
    return () => { clearInterval(t); clearInterval(tp); };
  }, [load, loadPhotos]);

  const networkAlert = () =>
    window.alert('Connection problem. Could not reach the database. Check your internet and try again.');

  const serve = async (id) => {
    try { await markServed(id); } catch (e) { networkAlert(); }
    load();
  };

  const respondCall = async (id) => {
    try { await setCallStatus(id, 'coming'); } catch (e) { networkAlert(); }
    load();
  };

  const finishCall = async (id) => {
    try { await deleteCall(id); } catch (e) { networkAlert(); }
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this request? It will be removed permanently.')) return;
    try { await deleteRequest(id); } catch (e) { networkAlert(); }
    load();
  };

  const clearHistory = async () => {
    if (!window.confirm('Clear all served requests? This cannot be undone.')) return;
    try { await clearServed(); } catch (e) { networkAlert(); }
    load();
  };

  const list = showServed ? served : pending;

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}><span style={s.backText}>‹ Back</span></button>
        <div style={s.headerCenter}>
          <span style={s.headerTitle}>Staff Panel</span>
          <span style={s.liveBadge}>
            <span className="live-dot" />
            <span style={s.liveText}>Live</span>
          </span>
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* Scrollable body — centered at maxWidth 800px */}
      <div style={s.body}>
        <div style={s.content}>

          {/* Stats row — calls / pending / served */}
          <div style={s.statsRow}>
            <div style={{ ...s.statBox, ...shadow.card }}>
              <span style={s.statEmoji}>🔔</span>
              <span style={{ ...s.statNum, color: calls.length > 0 ? colors.berry : colors.latte }}>
                {calls.length}
              </span>
              <span style={s.statLabel}>Active calls</span>
            </div>
            <div style={{ ...s.statBox, ...shadow.card }}>
              <span style={s.statEmoji}>⏳</span>
              <span style={{ ...s.statNum, color: pending.length > 0 ? colors.caramel : colors.latte }}>
                {pending.length}
              </span>
              <span style={s.statLabel}>Pending</span>
            </div>
            <div style={{ ...s.statBox, ...shadow.card }}>
              <span style={s.statEmoji}>✓</span>
              <span style={{ ...s.statNum, color: colors.leaf }}>{served.length}</span>
              <span style={s.statLabel}>Served today</span>
            </div>
          </div>

          {/* Tab switcher */}
          <div style={s.tabRow}>
            <button
              style={{ ...s.tab, ...(!showServed ? s.tabActive : {}) }}
              onClick={() => setShowServed(false)}
            >
              <span style={{ ...s.tabText, ...(!showServed ? s.tabTextActive : {}) }}>
                Pending queue {pending.length > 0 && !showServed
                  ? <span style={s.tabBadge}>{pending.length}</span>
                  : null}
              </span>
            </button>
            <button
              style={{ ...s.tab, ...(showServed ? s.tabActive : {}) }}
              onClick={() => setShowServed(true)}
            >
              <span style={{ ...s.tabText, ...(showServed ? s.tabTextActive : {}) }}>Served history</span>
            </button>
          </div>

          {/* ── Pending tab ── */}
          {!showServed && (
            <>
              {/* Active calls — full-width, pinned above the queue */}
              {calls.map(c => (
                <div key={c.id} style={{ ...s.callCard, ...shadow.card }}>
                  <div style={s.callCardLeft}>
                    <span style={s.callCardEmoji}>🔔</span>
                    <div>
                      <p style={s.callCardTitle}>{c.callerName} is calling you</p>
                      <div style={s.metaRow}>
                        {photos[c.callerId] && (
                          <img src={photos[c.callerId]} style={s.miniAvatar} alt="" />
                        )}
                        <span style={s.cardMeta}>{c.callerId} · {timeAgo(c.createdAt)}</span>
                      </div>
                      {c.status === 'coming' && (
                        <span style={s.comingNote}>You&apos;re on your way 👋</span>
                      )}
                    </div>
                  </div>
                  {c.status === 'pending'
                    ? <button style={s.comingBtn} onClick={() => respondCall(c.id)}>
                        <span style={s.btnText}>On my way 👋</span>
                      </button>
                    : <button style={s.doneBtn} onClick={() => finishCall(c.id)}>
                        <span style={s.btnText}>Done ✓</span>
                      </button>
                  }
                </div>
              ))}

              {/* Pending queue — 2-col grid on desktop */}
              {pending.length > 0 && (
                <div className="staff-queue">
                  {pending.map(item => (
                    <div key={item.id} style={{ ...s.card, ...shadow.card }}>
                      <span style={s.cardEmoji}>{item.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={s.cardTitle}>{item.qty} × {item.itemName}</p>
                        <div style={s.metaRow}>
                          {photos[item.requesterId] && (
                            <img src={photos[item.requesterId]} style={s.miniAvatar} alt="" />
                          )}
                          <span style={s.cardMeta}>{item.requester} · {timeAgo(item.createdAt)}</span>
                        </div>
                        {item.note && <span style={s.cardNote}>&ldquo;{item.note}&rdquo;</span>}
                      </div>
                      <div style={s.actions}>
                        <button style={s.serveBtn} onClick={() => serve(item.id)}>
                          <span style={s.serveBtnText}>Serve ✓</span>
                        </button>
                        <button style={s.deleteBtn} onClick={() => remove(item.id)}>
                          <span style={s.deleteText}>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending empty state */}
              {pending.length === 0 && calls.length === 0 && (
                <div style={s.empty}>
                  <span style={s.emptyEmoji}>🎉</span>
                  <p style={s.emptyTitle}>All caught up!</p>
                  <p style={s.emptyText}>No pending requests right now.</p>
                </div>
              )}
            </>
          )}

          {/* ── Served tab ── */}
          {showServed && (
            <>
              {/* Inline "Clear history" at top of served list */}
              {served.length > 0 && (
                <div style={s.clearRow}>
                  <p style={s.servedCount}>{served.length} item{served.length !== 1 ? 's' : ''} served</p>
                  <button style={s.clearBtn} onClick={clearHistory}>
                    <span style={s.clearText}>🗑 Clear all</span>
                  </button>
                </div>
              )}

              <div className="staff-queue">
                {served.map(item => (
                  <div key={item.id} style={s.servedCard}>
                    <span style={{ ...s.cardEmoji, opacity: 0.6 }}>{item.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={s.servedTitle}>{item.qty} × {item.itemName}</p>
                      <div style={s.metaRow}>
                        {photos[item.requesterId] && (
                          <img src={photos[item.requesterId]} style={s.miniAvatar} alt="" />
                        )}
                        <span style={s.cardMeta}>{item.requester} · served {timeAgo(item.servedAt)}</span>
                      </div>
                    </div>
                    <span style={s.servedCheck}>✓</span>
                  </div>
                ))}
              </div>

              {/* Served empty state */}
              {served.length === 0 && (
                <div style={s.empty}>
                  <span style={s.emptyEmoji}>🗒️</span>
                  <p style={s.emptyTitle}>Nothing served yet</p>
                  <p style={s.emptyText}>Served requests will appear here.</p>
                </div>
              )}
            </>
          )}

          <div style={{ height: 32 }} />
        </div>
      </div>
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
  headerCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  headerTitle: { color: colors.foam, fontSize: 19, fontWeight: 700 },
  liveBadge: { display: 'flex', alignItems: 'center' },
  liveText: { color: colors.leaf, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 },

  /* Scrollable body */
  body: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    display: 'flex',
    justifyContent: 'center',
  },

  /* Centered content */
  content: {
    width: '100%',
    maxWidth: 800,
    padding: '16px 16px 0',
  },

  /* Stats */
  statsRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    border: `1px solid ${colors.line}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
  },
  statEmoji: { fontSize: 16, marginBottom: 4 },
  statNum: { fontSize: 24, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 11, color: colors.latte, marginTop: 4, fontWeight: 600, textAlign: 'center' },

  /* Tabs */
  tabRow: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#DCE4F5',
    borderRadius: 999,
    padding: 4,
    marginBottom: 14,
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none',
    gap: 6,
  },
  tabActive: { backgroundColor: colors.espresso },
  tabText: { fontSize: 14, fontWeight: 700, color: colors.latte, display: 'flex', alignItems: 'center', gap: 6 },
  tabTextActive: { color: colors.foam },
  tabBadge: {
    backgroundColor: colors.berry,
    color: '#fff',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 1,
    paddingBottom: 1,
  },

  /* Call cards — full width, highlighted */
  callCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF3FD',
    borderRadius: radius.md,
    border: `2px solid ${colors.caramel}`,
    padding: '14px 16px',
    marginBottom: 14,
    gap: 12,
  },
  callCardLeft: { display: 'flex', flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12, minWidth: 0 },
  callCardEmoji: { fontSize: 28, flexShrink: 0 },
  callCardTitle: { fontSize: 15, fontWeight: 800, color: colors.espresso },
  comingNote: { fontSize: 12, color: colors.caramel, fontWeight: 700, marginTop: 3 },
  comingBtn: {
    backgroundColor: colors.caramel,
    borderRadius: radius.sm,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 10,
    paddingBottom: 10,
    cursor: 'pointer',
    flexShrink: 0,
    border: 'none',
    boxShadow: '0 3px 10px rgba(27,135,230,0.3)',
  },
  doneBtn: {
    backgroundColor: colors.leaf,
    borderRadius: radius.sm,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 10,
    paddingBottom: 10,
    cursor: 'pointer',
    flexShrink: 0,
    border: 'none',
  },
  btnText: { color: colors.foam, fontWeight: 800, fontSize: 13 },

  /* Pending queue cards */
  card: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    border: `1px solid ${colors.line}`,
    padding: '14px 16px',
  },
  cardEmoji: { fontSize: 30, marginRight: 12, flexShrink: 0 },
  cardTitle: { fontSize: 15, fontWeight: 800, color: colors.espresso },
  metaRow: { display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 },
  miniAvatar: { width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  cardMeta: { fontSize: 12, color: colors.latte },
  cardNote: { fontSize: 12, color: colors.bean, marginTop: 4, fontStyle: 'italic' },
  actions: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 },
  serveBtn: {
    backgroundColor: colors.leaf,
    borderRadius: radius.sm,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 9,
    paddingBottom: 9,
    cursor: 'pointer',
    border: 'none',
  },
  serveBtnText: { color: colors.foam, fontWeight: 800, fontSize: 13 },
  deleteBtn: { backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0' },
  deleteText: { color: colors.berry, fontSize: 12, fontWeight: 600 },

  /* Served cards */
  servedCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    border: `1px solid ${colors.line}`,
    padding: '12px 16px',
    opacity: 0.8,
  },
  servedTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.latte,
    textDecoration: 'line-through',
  },
  servedCheck: { fontSize: 20, color: colors.leaf, fontWeight: 800, flexShrink: 0, marginLeft: 8 },

  /* Clear served row */
  clearRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingLeft: 2,
    paddingRight: 2,
  },
  servedCount: { fontSize: 13, color: colors.latte, fontWeight: 600 },
  clearBtn: {
    backgroundColor: '#FEE8E7',
    border: `1px solid ${colors.berry}`,
    borderRadius: radius.sm,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 7,
    paddingBottom: 7,
    cursor: 'pointer',
  },
  clearText: { color: colors.berry, fontWeight: 700, fontSize: 13 },

  /* Empty states */
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 56,
    paddingBottom: 24,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: 800, color: colors.espresso, marginBottom: 6 },
  emptyText: { color: colors.latte, fontSize: 14, textAlign: 'center' },
};
