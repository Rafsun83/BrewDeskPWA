import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { registerEmployee, updateMyProfile, isValidEmployeeId } from "../db";
import { colors, radius, shadow } from "../theme";

// Profile photos are stored in the database as small base64 JPEGs,
// so shrink whatever the camera/gallery returns before saving.
async function toSmallBase64(uri) {
  const r = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 256 } }],
    {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );
  return `data:image/jpeg;base64,${r.base64}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Register a new employee profile, or edit the existing one when the
// `existing` prop is set (employee ID stays locked in edit mode).
export default function RegisterScreen({ onDone, onBack, existing }) {
  const isEdit = !!existing;
  const [name, setName] = useState(existing?.name || "");
  const [email, setEmail] = useState(existing?.email || "");
  const [employeeId, setEmployeeId] = useState(existing?.employeeId || "");
  const [photo, setPhoto] = useState(existing?.photo || "");
  const [busy, setBusy] = useState(false);

  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled) setPhoto(await toSmallBase64(res.assets[0].uri));
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Camera permission needed",
        "Allow camera access to take a profile photo.",
      );
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled) setPhoto(await toSmallBase64(res.assets[0].uri));
  };

  const submit = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanId = employeeId.trim();
    if (cleanName.length < 2) {
      Alert.alert("Name required", "Please enter your full name.");
      return;
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    if (!isValidEmployeeId(cleanId)) {
      Alert.alert(
        "Invalid employee ID",
        "Use 2–30 letters, numbers, dashes or underscores (e.g. EMP-042).",
      );
      return;
    }
    setBusy(true);
    try {
      const profile = isEdit
        ? await updateMyProfile({ name: cleanName, email: cleanEmail, photo })
        : await registerEmployee({
            employeeId: cleanId,
            name: cleanName,
            email: cleanEmail,
            photo,
          });
      onDone(profile);
    } catch (e) {
      if (e.code === "taken") {
        Alert.alert(
          "Employee ID already registered",
          "This ID is registered from another phone. If this is your ID, ask an admin to remove the old profile so you can register again.",
        );
      } else if (e.code === "denied") {
        Alert.alert(
          "Database permission denied",
          'The Firebase rules are blocking the "employees" node. Update the database rules in the Firebase console to allow it (see the README, Step 1.6).',
        );
      } else {
        Alert.alert(
          "Connection problem",
          "Could not save your profile. Check your internet and try again.",
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? "Edit profile" : "Create profile"}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {!isEdit && (
          <Text style={styles.intro}>
            Register once with your real details. Your employee ID gets locked
            to this phone, so nobody else can order under your name.
          </Text>
        )}

        {/* Photo */}
        <View style={styles.photoWrap}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={{ fontSize: 40 }}>🙂</Text>
            </View>
          )}
          <View style={styles.photoBtns}>
            <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
              <Text style={styles.photoBtnText}>📷 Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery}>
              <Text style={styles.photoBtnText}>🖼️ Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Name as on your employee ID"
          placeholderTextColor={colors.latte}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="e.g. ****@questionpro.com"
          placeholderTextColor={colors.latte}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Employee ID</Text>
        <TextInput
          style={[styles.input, isEdit && styles.inputLocked]}
          value={employeeId}
          onChangeText={setEmployeeId}
          placeholder="e.g. QPL_XXXX"
          placeholderTextColor={colors.latte}
          autoCapitalize="characters"
          editable={!isEdit}
        />
        {isEdit && (
          <Text style={styles.hint}>Your employee ID can't be changed.</Text>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, shadow.card, busy && { opacity: 0.6 }]}
          onPress={submit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.foam} />
          ) : (
            <Text style={styles.submitText}>
              {isEdit ? "Save changes" : "Register"}
            </Text>
          )}
        </TouchableOpacity>

        {!isEdit && (
          <Text style={styles.hint}>
            An admin will approve your profile before you can place orders.
          </Text>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { width: 60 },
  backText: { color: colors.caramel, fontSize: 17, fontWeight: "600" },
  headerTitle: { color: colors.foam, fontSize: 19, fontWeight: "700" },
  scroll: { padding: 20 },
  intro: {
    color: colors.latte,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 20,
  },
  photoWrap: { alignItems: "center", marginBottom: 20 },
  photo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: colors.caramel,
  },
  photoPlaceholder: {
    backgroundColor: colors.foam,
    alignItems: "center",
    justifyContent: "center",
  },
  photoBtns: { flexDirection: "row", gap: 10, marginTop: 12 },
  photoBtn: {
    backgroundColor: colors.foam,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  photoBtnText: { color: colors.espresso, fontWeight: "600", fontSize: 13 },
  label: {
    color: colors.latte,
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.foam,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 16,
    color: colors.espresso,
    marginBottom: 14,
  },
  inputLocked: { opacity: 0.55 },
  submitBtn: {
    backgroundColor: colors.caramel,
    borderRadius: radius.md,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: { color: colors.foam, fontSize: 17, fontWeight: "800" },
  hint: {
    color: colors.latte,
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
  },
});
