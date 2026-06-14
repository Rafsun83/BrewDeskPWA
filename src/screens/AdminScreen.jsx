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

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}><span style={s.backText}>‹ Back</span></button>
        <span style={s.headerTitle}>Admin Panel</span>
        <div style={{ width: 60 }} />
      </div>

      <div style={s.statsRow}>
        <div style={{ ...s.statBox, ...shadow.card }}>
          <span style={s.statNum}>{pendingCount}</span>
          <span style={s.statLabel}>Pending approval</span>
        </div>
        <div style={{ ...s.statBox, ...shadow.card }}>
          <span style={{ ...s.statNum, color: colors.leaf }}>{employees.length - pendingCount}</span>
          <span style={s.statLabel}>Approved</span>
        </div>
      </div>

      <div style={s.listContainer}>
        {employees.length === 0 ? (
          <div style={s.empty}>
            <span style={s.emptyEmoji}>🪪</span>
            <p style={s.emptyText}>
              No employee profiles yet. They appear here as soon as someone registers.
            </p>
          </div>
        ) : (
          employees.map(emp => (
            <div key={emp.employeeId} style={{ ...s.card, ...shadow.card, ...(!emp.approved ? s.cardPending : {}) }}>
              {emp.photo
                ? <img src={emp.photo} style={s.avatar} alt={emp.name} />
                : <div style={{ ...s.avatar, ...s.avatarFallback }}><span style={{ fontSize: 20 }}>🙂</span></div>
              }
              <div style={{ flex: 1 }}>
                <p style={s.name}>{emp.name}</p>
                <p style={s.meta}>{emp.employeeId} · {emp.email}</p>
                <p style={{ ...s.status, ...(emp.approved ? s.statusOk : s.statusPending) }}>
                  {emp.approved ? 'Approved ✓' : 'Waiting for approval'}
                </p>
              </div>
              <div style={s.actions}>
                <button
                  style={{ ...s.approveBtn, ...(emp.approved ? s.revokeBtn : {}) }}
                  onClick={() => toggleApproved(emp)}
                >
                  <span style={s.approveText}>{emp.approved ? 'Revoke' : 'Approve'}</span>
                </button>
                <button style={s.removeBtn} onClick={() => remove(emp)}>
                  <span style={s.removeText}>Remove</span>
                </button>
              </div>
            </div>
          ))
        )}
        <div style={{ height: 40 }} />
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
  listContainer: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: 16,
  },
  card: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    border: `1px solid ${colors.line}`,
    padding: 12,
    marginBottom: 12,
  },
  cardPending: { borderColor: colors.caramel, borderWidth: 2 },
  avatar: { width: 48, height: 48, borderRadius: '50%', marginRight: 12, objectFit: 'cover', flexShrink: 0 },
  avatarFallback: { backgroundColor: colors.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: 800, color: colors.espresso },
  meta: { fontSize: 12, color: colors.latte, marginTop: 2 },
  status: { fontSize: 12, fontWeight: 700, marginTop: 4 },
  statusOk: { color: colors.leaf },
  statusPending: { color: colors.berry },
  actions: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginLeft: 8, flexShrink: 0 },
  approveBtn: {
    backgroundColor: colors.leaf,
    borderRadius: radius.sm,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 9,
    paddingBottom: 9,
    cursor: 'pointer',
    border: 'none',
  },
  revokeBtn: { backgroundColor: colors.latte },
  approveText: { color: colors.foam, fontWeight: 800, fontSize: 13 },
  removeBtn: { backgroundColor: 'transparent', border: 'none', cursor: 'pointer' },
  removeText: { color: colors.berry, fontSize: 12, fontWeight: 600 },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 60,
    paddingLeft: 30,
    paddingRight: 30,
  },
  emptyEmoji: { fontSize: 44, marginBottom: 8 },
  emptyText: { color: colors.latte, fontSize: 15, textAlign: 'center', lineHeight: '22px' },
};
