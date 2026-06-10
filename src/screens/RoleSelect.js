import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { colors, radius, shadow } from '../theme';

const STAFF_PIN = '1234'; // change the staff PIN here

export default function RoleSelect({ onPickRole }) {
  const [pinVisible, setPinVisible] = useState(false);
  const [pin, setPin] = useState('');

  const tryStaffLogin = () => {
    if (pin === STAFF_PIN) {
      setPin('');
      setPinVisible(false);
      onPickRole('staff');
    } else {
      Alert.alert('Wrong PIN', 'Please try again. (Default PIN is 1234)');
      setPin('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoMark}>☕</Text>
        <Text style={styles.title}>BrewDesk</Text>
        <Text style={styles.subtitle}>
          Request coffee &amp; snacks. Staff serves them. Simple.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.card, shadow.card]}
        activeOpacity={0.85}
        onPress={() => onPickRole('user')}
      >
        <Text style={styles.cardEmoji}>🙋</Text>
        <View style={styles.cardTextWrap}>
          <Text style={styles.cardTitle}>I want something</Text>
          <Text style={styles.cardDesc}>Order coffee, tea or snacks</Text>
        </View>
        <Text style={styles.cardArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, styles.staffCard, shadow.card]}
        activeOpacity={0.85}
        onPress={() => setPinVisible(true)}
      >
        <Text style={styles.cardEmoji}>🧑‍🍳</Text>
        <View style={styles.cardTextWrap}>
          <Text style={[styles.cardTitle, styles.staffText]}>Staff panel</Text>
          <Text style={[styles.cardDesc, styles.staffDesc]}>
            See requests &amp; serve them
          </Text>
        </View>
        <Text style={[styles.cardArrow, styles.staffText]}>›</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>All data stays on this device</Text>

      <Modal visible={pinVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, shadow.card]}>
            <Text style={styles.modalTitle}>Staff PIN</Text>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              placeholder="••••"
              placeholderTextColor={colors.latte}
              autoFocus
            />
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setPin('');
                  setPinVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOk} onPress={tryStaffLogin}>
                <Text style={styles.modalOkText}>Enter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    padding: 24,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: 40 },
  logoMark: { fontSize: 56, marginBottom: 8 },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.espresso,
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: colors.latte,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.foam,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  staffCard: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  cardEmoji: { fontSize: 34, marginRight: 16 },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 19, fontWeight: '700', color: colors.espresso },
  cardDesc: { fontSize: 14, color: colors.latte, marginTop: 2 },
  staffText: { color: colors.foam },
  staffDesc: { color: '#C9B8A8' },
  cardArrow: { fontSize: 30, color: colors.caramel, fontWeight: '600' },
  footer: {
    textAlign: 'center',
    color: colors.latte,
    fontSize: 12,
    marginTop: 24,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(45,27,18,0.5)',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: colors.foam,
    borderRadius: radius.lg,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.espresso,
    marginBottom: 16,
    textAlign: 'center',
  },
  pinInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 8,
    color: colors.espresso,
    backgroundColor: colors.cream,
  },
  modalRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  modalCancelText: { color: colors.latte, fontWeight: '600' },
  modalOk: {
    flex: 1,
    padding: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.caramel,
  },
  modalOkText: { color: colors.foam, fontWeight: '700' },
});
