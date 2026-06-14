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
    } catch (e) { /* offline — keep existing photos */ }
  }, []);

  useEffect(() => {
    initStaffAlerts();
    load();
    loadPhotos();
    const t = setInterval(load, 3000);
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
    <div style={s.container}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}><span style={s.backText}>‹ Back</span></button>
        <span style={s.headerTitle}>Staff Panel</span>
        <div style={{ width: 60 }} />
      </div>

      <div style={s.statsRow}>
        <div style={{ ...s.statBox, ...shadow.card }}>
          <span style={s.statNum}>{pending.length}</span>
          <span style={s.statLabel}>Pending</span>
        </div>
        <div style={{ ...s.statBox, ...shadow.card }}>
          <span style={{ ...s.statNum, color: colors.leaf }}>{served.length}</span>
          <span style={s.statLabel}>Served</span>
        </div>
      </div>

      <div style={s.tabRow}>
        <button
          style={{ ...s.tab, ...(!showServed ? s.tabActive : {}) }}
          onClick={() => setShowServed(false)}
        >
          <span style={{ ...s.tabText, ...(!showServed ? s.tabTextActive : {}) }}>Pending queue</span>
        </button>
        <button
          style={{ ...s.tab, ...(showServed ? s.tabActive : {}) }}
          onClick={() => setShowServed(true)}
        >
          <span style={{ ...s.tabText, ...(showServed ? s.tabTextActive : {}) }}>Served history</span>
        </button>
      </div>

      <div style={s.listContainer}>
        {/* Active calls — pinned above the pending queue */}
        {!showServed && calls.map(c => (
          <div key={c.id} style={{ ...s.card, ...s.callCard, ...shadow.card }}>
            <span style={s.cardEmoji}>🔔</span>
            <div style={{ flex: 1 }}>
              <p style={s.cardTitle}>{c.callerName} is calling you</p>
              <div style={s.metaRow}>
                {photos[c.callerId] && (
                  <img src={photos[c.callerId]} style={s.miniAvatar} alt="" />
                )}
                <span style={s.cardMeta}>{c.callerId} · {timeAgo(c.createdAt)}</span>
              </div>
              {c.status === 'coming' && <span style={s.cardNote}>You&apos;re on your way 👋</span>}
            </div>
            {c.status === 'pending'
              ? <button style={s.comingBtn} onClick={() => respondCall(c.id)}><span style={s.serveText}>On my way 👋</span></button>
              : <button style={s.serveBtn} onClick={() => finishCall(c.id)}><span style={s.serveText}>Done ✓</span></button>
            }
          </div>
        ))}

        {/* Queue / history */}
        {list.map(item => (
          showServed ? (
            <div key={item.id} style={{ ...s.card, opacity: 0.85 }}>
              <span style={s.cardEmoji}>{item.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{ ...s.cardTitle, textDecoration: 'line-through', color: colors.latte }}>
                  {item.qty} × {item.itemName}
                </p>
                <div style={s.metaRow}>
                  {photos[item.requesterId] && (
                    <img src={photos[item.requesterId]} style={s.miniAvatar} alt="" />
                  )}
                  <span style={s.cardMeta}>{item.requester} · served {timeAgo(item.servedAt)}</span>
                </div>
              </div>
              <span style={s.servedCheck}>✓</span>
            </div>
          ) : (
            <div key={item.id} style={{ ...s.card, ...shadow.card }}>
              <span style={s.cardEmoji}>{item.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={s.cardTitle}>{item.qty} × {item.itemName}</p>
                <div style={s.metaRow}>
                  {photos[item.requesterId] && (
                    <img src={photos[item.requesterId]} style={s.miniAvatar} alt="" />
                  )}
                  <span style={s.cardMeta}>{item.requester} · {timeAgo(item.createdAt)}</span>
                </div>
                {item.note ? <span style={s.cardNote}>&ldquo;{item.note}&rdquo;</span> : null}
              </div>
              <div style={s.actions}>
                <button style={s.serveBtn} onClick={() => serve(item.id)}>
                  <span style={s.serveText}>Serve ✓</span>
                </button>
                <button style={s.deleteBtn} onClick={() => remove(item.id)}>
                  <span style={s.deleteText}>Delete</span>
                </button>
              </div>
            </div>
          )
        ))}

        {/* Empty state */}
        {list.length === 0 && (!(!showServed && calls.length > 0)) && (
          <div style={s.empty}>
            <span style={s.emptyEmoji}>{showServed ? '🗒️' : '🎉'}</span>
            <p style={s.emptyText}>
              {showServed ? 'No served items yet.' : 'No pending requests. All caught up!'}
            </p>
          </div>
        )}

        <div style={{ height: showServed && served.length > 0 ? 80 : 24 }} />
      </div>

      {showServed && served.length > 0 && (
        <button style={s.clearBtn} onClick={clearHistory}>
          <span style={s.clearText}>Clear served history</span>
        </button>
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
  statsRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    padding: '16px 16px 4px',
    flexShrink: 0,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    border: `1px solid ${colors.line}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 14,
  },
  statNum: { fontSize: 26, fontWeight: 800, color: colors.berry },
  statLabel: { fontSize: 12, color: colors.latte, marginTop: 2, fontWeight: 600 },
  tabRow: {
    display: 'flex',
    flexDirection: 'row',
    margin: '12px 16px 0',
    backgroundColor: '#DCE4F5',
    borderRadius: 999,
    padding: 4,
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
  },
  tabActive: { backgroundColor: colors.espresso },
  tabText: { fontSize: 14, fontWeight: 700, color: colors.latte },
  tabTextActive: { color: colors.foam },
  listContainer: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: 16,
    paddingBottom: 0,
    position: 'relative',
  },
  card: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    border: `1px solid ${colors.line}`,
    padding: 14,
    marginBottom: 12,
  },
  callCard: { borderColor: colors.caramel, borderWidth: 1.5, backgroundColor: '#EAF3FD' },
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
  },
  cardEmoji: { fontSize: 30, marginRight: 12, flexShrink: 0 },
  cardTitle: { fontSize: 16, fontWeight: 800, color: colors.espresso },
  metaRow: { display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 },
  miniAvatar: { width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  cardMeta: { fontSize: 12, color: colors.latte, marginTop: 2 },
  cardNote: { fontSize: 13, color: colors.bean, marginTop: 4, fontStyle: 'italic' },
  actions: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 },
  serveBtn: {
    backgroundColor: colors.leaf,
    borderRadius: radius.sm,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 10,
    paddingBottom: 10,
    cursor: 'pointer',
    border: 'none',
  },
  serveText: { color: colors.foam, fontWeight: 800, fontSize: 14 },
  deleteBtn: { backgroundColor: 'transparent', border: 'none', cursor: 'pointer' },
  deleteText: { color: colors.berry, fontSize: 12, fontWeight: 600 },
  servedCheck: { fontSize: 22, color: colors.leaf, fontWeight: 800, flexShrink: 0 },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyEmoji: { fontSize: 44, marginBottom: 8 },
  emptyText: { color: colors.latte, fontSize: 15, textAlign: 'center' },
  clearBtn: {
    position: 'fixed',
    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
    left: 20,
    right: 20,
    backgroundColor: colors.berry,
    borderRadius: radius.md,
    padding: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
  },
  clearText: { color: colors.foam, fontWeight: 800 },
};
