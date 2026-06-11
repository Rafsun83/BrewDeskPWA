import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { getRequests, markServed, clearServed, deleteRequest, timeAgo } from '../db';
import { colors, radius, shadow } from '../theme';

export default function StaffScreen({ onBack }) {
  const [pending, setPending] = useState([]);
  const [served, setServed] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showServed, setShowServed] = useState(false);

  const load = useCallback(async () => {
    const all = await getRequests();
    setPending(all.filter((r) => r.status === 'pending').sort((a, b) => a.createdAt - b.createdAt));
    setServed(all.filter((r) => r.status === 'served'));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 3000); // auto refresh queue
    return () => clearInterval(t);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const networkAlert = () =>
    Alert.alert('Connection problem', 'Could not reach the database. Check your internet and try again.');

  const serve = async (id) => {
    try {
      await markServed(id);
    } catch (e) {
      networkAlert();
    }
    load();
  };

  const remove = (id) => {
    Alert.alert('Delete request?', 'This will remove it permanently.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRequest(id);
          } catch (e) {
            networkAlert();
          }
          load();
        },
      },
    ]);
  };

  const clearHistory = () => {
    Alert.alert('Clear served history?', 'All served requests will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearServed();
          } catch (e) {
            networkAlert();
          }
          load();
        },
      },
    ]);
  };

  const renderPending = ({ item }) => (
    <View style={[styles.card, shadow.card]}>
      <Text style={styles.cardEmoji}>{item.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>
          {item.qty} × {item.itemName}
        </Text>
        <Text style={styles.cardMeta}>
          {item.requester} · {timeAgo(item.createdAt)}
        </Text>
        {item.note ? <Text style={styles.cardNote}>“{item.note}”</Text> : null}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.serveBtn} onPress={() => serve(item.id)}>
          <Text style={styles.serveText}>Serve ✓</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => remove(item.id)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderServed = ({ item }) => (
    <View style={[styles.card, styles.servedCard]}>
      <Text style={styles.cardEmoji}>{item.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, styles.servedTitle]}>
          {item.qty} × {item.itemName}
        </Text>
        <Text style={styles.cardMeta}>
          {item.requester} · served {timeAgo(item.servedAt)}
        </Text>
      </View>
      <Text style={styles.servedCheck}>✓</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Panel</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, shadow.card]}>
          <Text style={styles.statNum}>{pending.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statBox, shadow.card]}>
          <Text style={[styles.statNum, { color: colors.leaf }]}>{served.length}</Text>
          <Text style={styles.statLabel}>Served</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, !showServed && styles.tabActive]}
          onPress={() => setShowServed(false)}
        >
          <Text style={[styles.tabText, !showServed && styles.tabTextActive]}>
            Pending queue
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, showServed && styles.tabActive]}
          onPress={() => setShowServed(true)}
        >
          <Text style={[styles.tabText, showServed && styles.tabTextActive]}>
            Served history
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={showServed ? served : pending}
        keyExtractor={(r) => r.id}
        renderItem={showServed ? renderServed : renderPending}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{showServed ? '🗒️' : '🎉'}</Text>
            <Text style={styles.emptyText}>
              {showServed
                ? 'No served items yet.'
                : 'No pending requests. All caught up!'}
            </Text>
          </View>
        }
      />

      {showServed && served.length > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={clearHistory}>
          <Text style={styles.clearText}>Clear served history</Text>
        </TouchableOpacity>
      )}
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
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#EADDCB',
    borderRadius: 999,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  tabActive: { backgroundColor: colors.espresso },
  tabText: { fontSize: 14, fontWeight: '700', color: colors.latte },
  tabTextActive: { color: colors.foam },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 12,
  },
  servedCard: { opacity: 0.85 },
  cardEmoji: { fontSize: 30, marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.espresso },
  servedTitle: { textDecorationLine: 'line-through', color: colors.latte },
  cardMeta: { fontSize: 12, color: colors.latte, marginTop: 2 },
  cardNote: { fontSize: 13, color: colors.bean, marginTop: 4, fontStyle: 'italic' },
  actions: { alignItems: 'center', gap: 6 },
  serveBtn: {
    backgroundColor: colors.leaf,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  serveText: { color: colors.foam, fontWeight: '800', fontSize: 14 },
  deleteText: { color: colors.berry, fontSize: 12, fontWeight: '600' },
  servedCheck: { fontSize: 22, color: colors.leaf, fontWeight: '800' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 44, marginBottom: 8 },
  emptyText: { color: colors.latte, fontSize: 15, textAlign: 'center' },
  clearBtn: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: colors.berry,
    borderRadius: radius.md,
    padding: 15,
    alignItems: 'center',
  },
  clearText: { color: colors.foam, fontWeight: '800' },
});
