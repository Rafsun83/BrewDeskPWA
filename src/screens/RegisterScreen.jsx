import React, { useState, useRef } from 'react';
import { registerEmployee, updateMyProfile, isValidEmployeeId } from '../db.js';
import { colors, radius, shadow } from '../theme.js';

// Resize + compress a File object to a small base64 JPEG (max 256px wide).
function resizeImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 256 / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.src = url;
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({ onDone, onBack, existing }) {
  const isEdit = !!existing;
  const [name, setName] = useState(existing?.name || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [employeeId, setEmployeeId] = useState(existing?.employeeId || '');
  const [photo, setPhoto] = useState(existing?.photo || '');
  const [busy, setBusy] = useState(false);

  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file);
    setPhoto(dataUrl);
    e.target.value = '';
  };

  const submit = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanId = employeeId.trim();
    if (cleanName.length < 2) {
      window.alert('Name required. Please enter your full name.');
      return;
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      window.alert('Invalid email. Please enter a valid email address.');
      return;
    }
    if (!isValidEmployeeId(cleanId)) {
      window.alert('Invalid employee ID. Use 2–30 letters, numbers, dashes or underscores (e.g. EMP-042).');
      return;
    }
    setBusy(true);
    try {
      const profile = isEdit
        ? await updateMyProfile({ name: cleanName, email: cleanEmail, photo })
        : await registerEmployee({ employeeId: cleanId, name: cleanName, email: cleanEmail, photo });
      onDone(profile);
    } catch (e) {
      if (e.code === 'taken') {
        window.alert('Employee ID already registered. This ID belongs to another device. Ask an admin to remove the old profile so you can register again.');
      } else if (e.code === 'denied') {
        window.alert('Database permission denied. Update the Firebase rules to allow the "employees" node (see README Step 1.6).');
      } else {
        window.alert('Connection problem. Could not save your profile. Check your internet and try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>
          <span style={s.backText}>‹ Back</span>
        </button>
        <span style={s.headerTitle}>{isEdit ? 'Edit profile' : 'Create profile'}</span>
        <div style={{ width: 60 }} />
      </div>

      <div style={s.scroll}>
        {!isEdit && (
          <p style={s.intro}>
            Register once with your real details. Your employee ID gets locked to this device so nobody else can order under your name.
          </p>
        )}

        <div style={s.photoWrap}>
          {photo ? (
            <img src={photo} style={s.photo} alt="Profile" />
          ) : (
            <div style={{ ...s.photo, ...s.photoPlaceholder }}>
              <span style={{ fontSize: 40 }}>🙂</span>
            </div>
          )}
          <div style={s.photoBtns}>
            <button style={s.photoBtn} onClick={() => cameraRef.current?.click()}>
              <span style={s.photoBtnText}>📷 Camera</span>
            </button>
            <button style={s.photoBtn} onClick={() => galleryRef.current?.click()}>
              <span style={s.photoBtnText}>🖼️ Gallery</span>
            </button>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input ref={cameraRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handleFile} />
        <input ref={galleryRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

        <label style={s.label}>Full name</label>
        <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="Name as on your employee ID" />

        <label style={s.label}>Email</label>
        <input style={s.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. ****@questionpro.com" type="email" autoCapitalize="none" />

        <label style={s.label}>Employee ID</label>
        <input
          style={{ ...s.input, ...(isEdit ? s.inputLocked : {}) }}
          value={employeeId}
          onChange={e => setEmployeeId(e.target.value.toUpperCase())}
          placeholder="e.g. QPL_XXXX"
          disabled={isEdit}
        />
        {isEdit && <p style={s.hint}>Your employee ID can't be changed.</p>}

        <button
          style={{ ...s.submitBtn, ...shadow.card, ...(busy ? { opacity: 0.6 } : {}) }}
          onClick={submit}
          disabled={busy}
        >
          {busy
            ? <div style={s.spinner} />
            : <span style={s.submitText}>{isEdit ? 'Save changes' : 'Register'}</span>
          }
        </button>

        {!isEdit && (
          <p style={s.hint}>An admin will approve your profile before you can place orders.</p>
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
  scroll: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: 20,
  },
  intro: {
    color: colors.latte,
    fontSize: 14,
    lineHeight: '21px',
    textAlign: 'center',
    marginBottom: 20,
  },
  photoWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
  },
  photo: {
    width: 110,
    height: 110,
    borderRadius: '50%',
    border: `2px solid ${colors.caramel}`,
    objectFit: 'cover',
  },
  photoPlaceholder: {
    backgroundColor: colors.foam,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtns: { display: 'flex', flexDirection: 'row', gap: 10, marginTop: 12 },
  photoBtn: {
    backgroundColor: colors.foam,
    border: `1px solid ${colors.line}`,
    borderRadius: 999,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    cursor: 'pointer',
  },
  photoBtnText: { color: colors.espresso, fontWeight: 600, fontSize: 13 },
  label: {
    display: 'block',
    color: colors.latte,
    fontSize: 13,
    marginBottom: 6,
    fontWeight: 600,
  },
  input: {
    display: 'block',
    width: '100%',
    backgroundColor: colors.foam,
    border: `1px solid ${colors.line}`,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 16,
    color: colors.espresso,
    marginBottom: 14,
  },
  inputLocked: { opacity: 0.55, cursor: 'not-allowed' },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: colors.caramel,
    borderRadius: radius.md,
    padding: 16,
    marginTop: 8,
    cursor: 'pointer',
    border: 'none',
  },
  submitText: { color: colors.foam, fontSize: 17, fontWeight: 800 },
  hint: {
    color: colors.latte,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: '18px',
  },
  spinner: {
    width: 24,
    height: 24,
    border: '3px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
