import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { STAFF_PIN, ADMIN_PIN } from "../config";
import { colors, radius, shadow } from "../theme";

export default function RoleSelect({ onPickRole }) {
  // which PIN-protected role is being entered: null | 'staff' | 'admin'
  const [pinFor, setPinFor] = useState(null);
  const [pin, setPin] = useState("");

  const tryPinLogin = () => {
    const expected = pinFor === "admin" ? ADMIN_PIN : STAFF_PIN;
    if (pin === expected) {
      const role = pinFor;
      setPin("");
      setPinFor(null);
      onPickRole(role);
    } else {
      Alert.alert("Wrong PIN", "Please try again.");
      setPin("");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/splash-icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>BrewDesk</Text>
        <Text style={styles.subtitle}>
          Request coffee &amp; snacks. Staff serves them. Simple.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.card, shadow.card]}
        activeOpacity={0.85}
        onPress={() => onPickRole("user")}
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
        onPress={() => setPinFor("staff")}
      >
        <Text style={styles.cardEmoji}>🧑‍🍳</Text>
        <View style={styles.cardTextWrap}>
          <Text style={[styles.cardTitle, styles.onBlueText]}>Staff panel</Text>
          <Text style={[styles.cardDesc, styles.onBlueDesc]}>
            See requests &amp; serve them
          </Text>
        </View>
        <Text style={[styles.cardArrow, styles.onBlueText]}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, styles.adminCard, shadow.card]}
        activeOpacity={0.85}
        onPress={() => setPinFor("admin")}
      >
        <Text style={styles.cardEmoji}>🛡️</Text>
        <View style={styles.cardTextWrap}>
          <Text style={[styles.cardTitle, styles.onBlueText]}>Admin panel</Text>
          <Text style={[styles.cardDesc, styles.onBlueDesc]}>
            Approve &amp; manage employee profiles
          </Text>
        </View>
        <Text style={[styles.cardArrow, styles.onBlueText]}>›</Text>
      </TouchableOpacity>

      <Modal visible={pinFor !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, shadow.card]}>
            <Text style={styles.modalTitle}>
              {pinFor === "admin" ? "Admin PIN" : "Staff PIN"}
            </Text>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              placeholder="••••"
              placeholderTextColor={colors.qpMist}
              autoFocus
            />
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setPin("");
                  setPinFor(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOk} onPress={tryPinLogin}>
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
    backgroundColor: colors.qpNavy,
    padding: 24,
    justifyContent: "center",
  },
  header: { alignItems: "center", marginBottom: 36 },
  logo: { width: 150, height: 150, marginBottom: -10 },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: colors.qpMist,
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 16,
  },
  staffCard: { backgroundColor: colors.qpBlue },
  adminCard: {
    backgroundColor: colors.qpNavyDeep,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  cardEmoji: { fontSize: 34, marginRight: 16 },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 19, fontWeight: "700", color: colors.qpNavy },
  cardDesc: { fontSize: 14, color: "#5A6B96", marginTop: 2 },
  onBlueText: { color: "#FFFFFF" },
  onBlueDesc: { color: "rgba(255,255,255,0.75)" },
  cardArrow: { fontSize: 30, color: colors.qpBlue, fontWeight: "600" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(8,17,45,0.6)",
    justifyContent: "center",
    padding: 32,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.qpNavy,
    marginBottom: 16,
    textAlign: "center",
  },
  pinInput: {
    borderWidth: 1,
    borderColor: "#D6DEF0",
    borderRadius: radius.md,
    padding: 14,
    fontSize: 22,
    textAlign: "center",
    letterSpacing: 8,
    color: colors.qpNavy,
    backgroundColor: "#F2F5FC",
  },
  modalRow: { flexDirection: "row", marginTop: 16, gap: 12 },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D6DEF0",
  },
  modalCancelText: { color: "#5A6B96", fontWeight: "600" },
  modalOk: {
    flex: 1,
    padding: 14,
    borderRadius: radius.md,
    alignItems: "center",
    backgroundColor: colors.qpBlue,
  },
  modalOkText: { color: "#FFFFFF", fontWeight: "700" },
});
