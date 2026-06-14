import React, { useEffect, useState, useCallback } from 'react';
import { getEmployees, setEmployeeApproved, deleteEmployee } from '../db.js';
import { colors, radius, shadow } from '../theme.js';

export default function AdminScreen({ onBack }) {
  const [employees, setEmployees] = useState([]);

  const load = useCallback(async () => {
    try {
      const list = await getEmployees();
      list.sort((a, b) =>
        a.approved === b.approved ? a.name.localeCompare(b.name) : a.approved ? 1 : -1
      );
      setEmployees(list);
    } catch (e) { /* network hiccup — keep current list */ }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const networkAlert = () =>
    window.alert('Connection problem. Could not reach the database. Check your internet and try again.');

  const toggleApproved = async (emp) => {
    try { await setEmployeeApproved(emp.employeeId, !emp.approved); } catch (e) { networkAlert(); }
    load();
  };

  const remove = async (emp) => {
    if (!window.confirm(`Remove ${emp.name}?\n\nThe employee ID "${emp.employeeId}" will be freed and can be registered again from any device.`)) return;
    try { await deleteEmployee(emp.employeeId); } catch (e) { networkAlert(); }
    load();
  };

  const pendingCount = employees.filter(e => !e.approved).length;
  const approvedCount = employees.length - pendingCount;

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>
          <span style={s.backText}>‹ Back</span>
        </button>
        <div style={s.headerCenter}>
          <span style={s.headerTitle}>Admin Panel</span>
          <span style={s.headerSub}>Employee management</span>
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* Scrollable content — centered at maxWidth 860px */}
      <div style={s.scroll}>
        <div style={s.content}>

          {/* Stats row */}
          <div style={s.statsRow}>
            <div style={{ ...s.statBox, ...shadow.card }}>
              <span style={s.statEmoji}>👥</span>
              <span style={{ ...s.statNum, color: colors.espresso }}>{employees.length}</span>
              <span style={s.statLabel}>Total</span>
            </div>
            <div style={{ ...s.statBox, ...shadow.card }}>
              <span style={s.statEmoji}>⏳</span>
              <span style={{ ...s.statNum, color: pendingCount > 0 ? colors.berry : colors.latte }}>
                {pendingCount}
              </span>
              <span style={s.statLabel}>Pending</span>
            </div>
            <div style={{ ...s.statBox, ...shadow.card }}>
              <span style={s.statEmoji}>✅</span>
              <span style={{ ...s.statNum, color: colors.leaf }}>{approvedCount}</span>
              <span style={s.statLabel}>Approved</span>
            </div>
          </div>

          {/* Section label */}
          {employees.length > 0 && (
            <div style={s.sectionRow}>
              <span style={s.sectionTitle}>All employees</span>
              <span style={s.sectionCount}>{employees.length}</span>
            </div>
          )}

          {/* Employee list / grid */}
          {employees.length === 0 ? (
            <div style={s.empty}>
              <span style={s.emptyEmoji}>🪪</span>
              <p style={s.emptyTitle}>No profiles yet</p>
              <p style={s.emptyDesc}>
                Employee profiles appear here as soon as someone registers from any device.
              </p>
            </div>
          ) : (
            <div className="admin-grid">
              {employees.map(emp => (
                <div
                  key={emp.employeeId}
                  style={{
                    ...s.card,
                    ...shadow.card,
                    ...(!emp.approved ? s.cardPending : {}),
                  }}
                >
                  {/* Avatar + info */}
                  <div style={s.cardTop}>
                    {emp.photo
                      ? <img src={emp.photo} style={s.avatar} alt={emp.name} />
                      : (
                        <div style={{ ...s.avatar, ...s.avatarFallback }}>
                          <span style={{ fontSize: 22 }}>🙂</span>
                        </div>
                      )
                    }
                    <div style={s.info}>
                      <p style={s.name}>{emp.name}</p>
                      <p style={s.metaId}>{emp.employeeId}</p>
                      <p style={s.metaEmail}>{emp.email}</p>
                    </div>
                    <span style={{ ...s.badge, ...(emp.approved ? s.badgeOk : s.badgePending) }}>
                      {emp.approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>

                  {/* Divider */}
                  <div style={s.cardDivider} />

                  {/* Action buttons */}
                  <div style={s.actions}>
                    <button
                      className="admin-action-btn"
                      style={{ ...s.approveBtn, ...(emp.approved ? s.revokeBtn : {}) }}
                      onClick={() => toggleApproved(emp)}
                    >
                      {emp.approved ? 'Revoke access' : '✓ Approve'}
                    </button>
                    <button
                      className="admin-remove-btn"
                      style={s.removeBtn}
                      onClick={() => remove(emp)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ height: 40 }} />
        </div>
      </div>
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

  /* Header */
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
  headerCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  headerTitle: { color: colors.foam, fontSize: 19, fontWeight: 700 },
  headerSub: { color: colors.qpMist, fontSize: 11, marginTop: 2, fontWeight: 500 },

  /* Scroll + content */
  scroll: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  content: {
    maxWidth: 860,
    margin: '0 auto',
    padding: '20px 16px 0',
  },

  /* Stats */
  statsRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    border: `1px solid ${colors.line}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    gap: 2,
  },
  statEmoji: { fontSize: 18, marginBottom: 4 },
  statNum: { fontSize: 26, fontWeight: 800 },
  statLabel: { fontSize: 11, color: colors.latte, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },

  /* Section label */
  sectionRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: colors.latte, textTransform: 'uppercase', letterSpacing: 0.6 },
  sectionCount: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.foam,
    backgroundColor: colors.latte,
    borderRadius: 999,
    paddingLeft: 7,
    paddingRight: 7,
    paddingTop: 2,
    paddingBottom: 2,
  },

  /* Employee card */
  card: {
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    border: `1px solid ${colors.line}`,
    padding: '16px 16px 14px',
    display: 'flex',
    flexDirection: 'column',
  },
  cardPending: {
    borderColor: colors.berry,
    borderWidth: 2,
    backgroundColor: '#FFF8F8',
  },
  cardTop: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
    border: `2px solid ${colors.line}`,
  },
  avatarFallback: {
    backgroundColor: colors.cream,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  name: {
    fontSize: 15,
    fontWeight: 800,
    color: colors.espresso,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  metaId: { fontSize: 12, color: colors.latte, marginTop: 3, fontWeight: 600 },
  metaEmail: {
    fontSize: 11,
    color: colors.latte,
    marginTop: 2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  badge: {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 999,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 3,
    paddingBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    alignSelf: 'flex-start',
  },
  badgeOk: { color: colors.leaf, backgroundColor: '#EDFBF3', border: `1px solid #B8EDD0` },
  badgePending: { color: colors.berry, backgroundColor: '#FFF0EF', border: `1px solid #F5C0BC` },

  cardDivider: {
    height: 1,
    backgroundColor: colors.line,
    margin: '14px 0 12px',
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: colors.leaf,
    color: colors.foam,
    fontWeight: 700,
    fontSize: 13,
    borderRadius: radius.sm,
    padding: '9px 0',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.12s ease',
  },
  revokeBtn: { backgroundColor: colors.latte },
  removeBtn: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 9,
    paddingBottom: 9,
    borderRadius: radius.sm,
    border: `1px solid ${colors.berry}`,
    backgroundColor: 'transparent',
    color: colors.berry,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },

  /* Empty state */
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 72,
    paddingLeft: 24,
    paddingRight: 24,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: colors.espresso, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: colors.latte, textAlign: 'center', lineHeight: '22px', maxWidth: 320 },
};
