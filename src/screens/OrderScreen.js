import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MENU } from '../data/menu';
import {
  addRequest,
  getRequests,
  getLastName,
  saveLastName,
  timeAgo,
} from '../db';
import { colors, radius, shadow } from '../theme';

export default function OrderScreen({ onBack }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(null); // menu item being ordered
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [toast, setToast] = useState('');

  const loadMine = useCallback(async (who) => {
    const all = await getRequests();
    const mine = who
      ? all.filter((r) => r.requester.toLowerCase() === who.toLowerCase())
      : [];
    setMyRequests(mine.slice(0, 10));
  }, []);

  useEffect(() => {
    (async () => {
      const last = await getLastName();
      setName(last);
      loadMine(last);
    })();
  }, [loadMine]);

  // refresh "my requests" every few seconds so served status updates live
  useEffect(() => {
    const t = setInterval(() => loadMine(name), 4000);
    return () => clearInterval(t);
  }, [name, loadMine]);

  const openItem = (item) => {
    setSelected(item);
    setQty(1);
    setNote('');
  };

  const submit = async () => {
    const who = name.trim() || 'Guest';
    await saveLastName(who);
    try {
      await addRequest({
        itemId: selected.id,
        itemName: selected.name,
        emoji: selected.emoji,
        qty,
        note: note.trim(),
        requester: who,
      });
    } catch (e) {
      setToast('Could not send — check your internet connection ❌');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    setSelected(null);
    setToast(`Request sent: ${qty} × ${selected.name} ✅`);
    loadMine(who);
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Name input */}
        <Text style={styles.label}>Your name</Text>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Rakib"
          placeholderTextColor={colors.latte}
        />

        {/* Menu */}
        {MENU.map((section) => (
          <View key={section.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={styles.grid}>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, shadow.card]}
                  activeOpacity={0.8}
                  onPress={() => openItem(item)}
                >
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* My requests */}
        {myRequests.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.sectionTitle}>My recent requests</Text>
            {myRequests.map((r) => (
              <View key={r.id} style={[styles.reqRow, shadow.card]}>
                <Text style={styles.reqEmoji}>{r.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reqName}>
                    {r.qty} × {r.itemName}
                  </Text>
                  <Text style={styles.reqTime}>{timeAgo(r.createdAt)}</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    r.status === 'served' ? styles.badgeServed : styles.badgePending,
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {r.status === 'served' ? 'Served ✓' : 'Pending'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Toast */}
      {toast !== '' && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Order modal */}
      <Modal visible={!!selected} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          {selected && (
            <View style={[styles.sheet, shadow.card]}>
              <Text style={styles.sheetEmoji}>{selected.emoji}</Text>
              <Text style={styles.sheetTitle}>{selected.name}</Text>

              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQty(Math.max(1, qty - 1))}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{qty}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQty(Math.min(20, qty + 1))}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Note (optional) — e.g. less sugar"
                placeholderTextColor={colors.latte}
              />

              <TouchableOpacity style={styles.sendBtn} onPress={submit}>
                <Text style={styles.sendBtnText}>Send request</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelected(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
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
  scroll: { padding: 16 },
  label: { color: colors.latte, fontSize: 13, marginBottom: 6, fontWeight: '600' },
  nameInput: {
    backgroundColor: colors.foam,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 16,
    color: colors.espresso,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.espresso,
    marginTop: 18,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '48%',
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 12,
  },
  itemEmoji: { fontSize: 32, marginBottom: 6 },
  itemName: { fontSize: 14, fontWeight: '600', color: colors.espresso },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.foam,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    marginBottom: 10,
  },
  reqEmoji: { fontSize: 24, marginRight: 12 },
  reqName: { fontSize: 15, fontWeight: '700', color: colors.espresso },
  reqTime: { fontSize: 12, color: colors.latte, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgePending: { backgroundColor: '#F6E3D3' },
  badgeServed: { backgroundColor: '#DCEDE2' },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.espresso },
  toast: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: colors.espresso,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
  },
  toastText: { color: colors.foam, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(45,27,18,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.foam,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 24,
    alignItems: 'center',
  },
  sheetEmoji: { fontSize: 44 },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.espresso,
    marginTop: 6,
    marginBottom: 16,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  qtyBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 26, color: colors.espresso, fontWeight: '600' },
  qtyValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.espresso,
    marginHorizontal: 26,
    minWidth: 36,
    textAlign: 'center',
  },
  noteInput: {
    alignSelf: 'stretch',
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
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
    alignItems: 'center',
  },
  sendBtnText: { color: colors.foam, fontSize: 17, fontWeight: '800' },
  cancelBtn: { padding: 14 },
  cancelBtnText: { color: colors.latte, fontWeight: '600' },
});
