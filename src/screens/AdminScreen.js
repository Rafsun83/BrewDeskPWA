import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { getEmployees, setEmployeeApproved, deleteEmployee } from '../db';
import { colors, radius, shadow } from '../theme';

// Admin panel: approve new employee profiles and remove old/fake ones.
// Removing a profile frees the employee ID so it can be registered again
// (e.g. when someone gets a new phone).
export default function AdminScreen({ onBack }) {
  const [employees, setEmployees] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await getEmployees();
      // pending approvals first, then alphabetical
      list.sort((a, b) =>
        a.approved === b.approved ? a.name.localeCompare(b.name) : a.approved ? 1 : -1
      );
      setEmployees(list);
    } catch (e) {
      // network hiccup — keep the current list
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const networkAlert = () =>
    Alert.alert('Connection problem', 'Could not reach the database. Check your internet and try again.');

  const toggleApproved = async (emp) => {
    try {
      await setEmployeeApproved(emp.employeeId, !emp.approved);
    } catch (e) {
      networkAlert();
    }
    load();
  };

  const remove = (emp) => {
    Alert.alert(
      `Remove ${emp.name}?`,
      `The employee ID "${emp.employeeId}" will be freed and can be registered again from any phone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmployee(emp.employeeId);
            } catch (e) {
              networkAlert();
            }
            load();
          },
        },
      ]
    );
  };

  const pendingCount = employees.filter((e) => !e.approved).length;

  const renderEmployee = ({ item }) => (
    <View style={[styles.card, shadow.card, !item.approved && styles.cardPending]}>
      {item.photo ? (
        <Image source={{ uri: item.photo }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={{ fontSize: 20 }}>🙂</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>{item.employeeId} · {item.email}</Text>
        <Text style={[styles.status, item.approved ? styles.statusOk : styles.statusPending]}>
          {item.approved ? 'Approved ✓' : 'Waiting for approval'}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.approveBtn, item.approved && styles.revokeBtn]}
          onPress={() => toggleApproved(item)}
        >
          <Text style={styles.approveText}>{item.approved ? 'Revoke' : 'Approve'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => remove(item)}>
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, shadow.card]}>
          <Text style={styles.statNum}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending approval</Text>
        </View>
        <View style={[styles.statBox, shadow.card]}>
          <Text style={[styles.statNum, { color: colors.leaf }]}>
            {employees.length - pendingCount}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
      </View>

      <FlatList
        data={employees}
        keyExtractor={(e) => e.employeeId}
        renderItem={renderEmployee}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🪪</Text>
            <Text style={styles.emptyText}>
              No employee profiles yet. They appear here as soon as someone registers.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: {
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.espresso,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 60 },
  backText: { color: colors.caramel, fontSize: 17, fontWeight: '600' },
  headerTitle: { color: colors.foam, fontSize: 19, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 4 },
  statBox: {
    flex: 1,
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    paddingVertical: 14,
  },
  statNum: { fontSize: 26, fontWeight: '800', color: colors.berry },
  statLabel: { fontSize: 12, color: colors.latte, marginTop: 2, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    marginBottom: 12,
  },
  cardPending: { borderColor: colors.caramel, borderWidth: 2 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarFallback: {
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 16, fontWeight: '800', color: colors.espresso },
  meta: { fontSize: 12, color: colors.latte, marginTop: 2 },
  status: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  statusOk: { color: colors.leaf },
  statusPending: { color: colors.berry },
  actions: { alignItems: 'center', gap: 6, marginLeft: 8 },
  approveBtn: {
    backgroundColor: colors.leaf,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  revokeBtn: { backgroundColor: colors.latte },
  approveText: { color: colors.foam, fontWeight: '800', fontSize: 13 },
  removeText: { color: colors.berry, fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
  emptyEmoji: { fontSize: 44, marginBottom: 8 },
  emptyText: { color: colors.latte, fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
