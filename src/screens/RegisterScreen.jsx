import React, { useState, useRef } from 'react';
import { registerEmployee, updateMyProfile, isValidEmployeeId } from '../db.js';
import { colors, radius, shadow } from '../theme.js';

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
    setPhoto(await resizeImage(file));
    e.target.value = '';
  };

  const submit = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanId = employeeId.trim();
    if (cleanName.length < 2) { window.alert('Name required. Please enter your full name.'); return; }
    if (!EMAIL_RE.test(cleanEmail)) { window.alert('Invalid email. Please enter a valid email address.'); return; }
    if (!isValidEmployeeId(cleanId)) { window.alert('Invalid employee ID. Use 2–30 letters, numbers, dashes or underscores (e.g. EMP-042).'); return; }
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
    <div style={s.page}>
      {/* Top header bar */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>
          <span style={s.backText}>‹ Back</span>
        </button>
        <span style={s.headerTitle}>{isEdit ? 'Edit profile' : 'Create profile'}</span>
        <div style={{ width: 60 }} />
      </div>

      {/* Scrollable body — centers the form card horizontally */}
      <div style={s.body}>
        <div style={{ ...s.card, ...shadow.card }}>

          {/* Avatar */}
          <div style={s.avatarSection}>
            {photo
              ? <img src={photo} style={s.avatar} alt="Profile" />
              : <div style={{ ...s.avatar, ...s.avatarFallback }}><span style={{ fontSize: 42 }}>🙂</span></div>
            }
            <div style={s.photoBtns}>
              <button style={s.photoBtn} onClick={() => cameraRef.current?.click()}>
                <span style={s.photoBtnText}>📷 Camera</span>
              </button>
              <button style={s.photoBtn} onClick={() => galleryRef.current?.click()}>
                <span style={s.photoBtnText}>🖼️ Gallery</span>
              </button>
            </div>
          </div>

          <input ref={cameraRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handleFile} />
          <input ref={galleryRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

          {/* Intro note (register mode only) */}
          {!isEdit && (
            <div style={s.infoBanner}>
              <span style={s.infoIcon}>🔒</span>
              <p style={s.infoText}>
                Register once with your real details. Your employee ID gets locked to this device — nobody else can order under your name.
              </p>
            </div>
          )}

          <div style={s.divider} />

          {/* Form fields */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Full name</label>
            <input
              className="brew-input"
              style={s.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name as on your employee ID"
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Work email</label>
            <input
              className="brew-input"
              style={s.input}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. ****@questionpro.com"
              type="email"
              autoCapitalize="none"
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>
              Employee ID
              {isEdit && <span style={s.lockedBadge}>Locked</span>}
            </label>
            <input
              className="brew-input"
              style={{ ...s.input, ...(isEdit ? s.inputLocked : {}) }}
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value.toUpperCase())}
              placeholder="e.g. QPL_XXXX"
              disabled={isEdit}
            />
            {isEdit && <p style={s.fieldHint}>Employee ID is permanent and cannot be changed.</p>}
          </div>

          {/* Submit */}
          <button
            style={{ ...s.submitBtn, ...(busy ? { opacity: 0.65 } : {}) }}
            onClick={submit}
            disabled={busy}
          >
            {busy
              ? <div style={s.spinner} />
              : <span style={s.submitText}>{isEdit ? 'Save changes' : 'Create profile'}</span>
            }
          </button>

          {!isEdit && (
            <p style={s.bottomHint}>
              ⏳ An admin will review and approve your profile before you can place orders.
            </p>
          )}
        </div>

        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}

const s = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    backgroundColor: colors.cream,
    overflow: 'hidden',
  },

  /* Header */
  header: {
    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)',
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

  /* Scrollable body */
  body: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: '28px 16px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  /* White form card */
  card: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: colors.foam,
    borderRadius: radius.lg,
    padding: 28,
    border: `1px solid ${colors.line}`,
  },

  /* Avatar section */
  avatarSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    border: `3px solid ${colors.caramel}`,
    objectFit: 'cover',
  },
  avatarFallback: {
    backgroundColor: colors.cream,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtns: { display: 'flex', gap: 10, marginTop: 14 },
  photoBtn: {
    backgroundColor: colors.cream,
    border: `1px solid ${colors.line}`,
    borderRadius: 999,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    cursor: 'pointer',
  },
  photoBtnText: { color: colors.espresso, fontWeight: 600, fontSize: 13 },

  /* Info banner */
  infoBanner: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EEF3FB',
    borderRadius: radius.md,
    border: `1px solid ${colors.line}`,
    padding: '12px 14px',
    marginBottom: 20,
  },
  infoIcon: { fontSize: 16, flexShrink: 0, marginTop: 1 },
  infoText: { fontSize: 13, color: colors.latte, lineHeight: '20px' },

  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginBottom: 22,
  },

  /* Fields */
  fieldGroup: { marginBottom: 18 },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: colors.espresso,
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 7,
  },
  lockedBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.latte,
    backgroundColor: colors.cream,
    border: `1px solid ${colors.line}`,
    borderRadius: 999,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 2,
    paddingBottom: 2,
  },
  input: {
    display: 'block',
    width: '100%',
    backgroundColor: '#FAFBFF',
    border: `1px solid ${colors.line}`,
    borderRadius: radius.md,
    padding: '12px 14px',
    fontSize: 15,
    color: colors.espresso,
    transition: 'border-color 0.15s ease',
  },
  inputLocked: {
    opacity: 0.6,
    cursor: 'not-allowed',
    backgroundColor: colors.cream,
  },
  fieldHint: {
    fontSize: 12,
    color: colors.latte,
    marginTop: 6,
  },

  /* Submit */
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: colors.caramel,
    borderRadius: radius.md,
    padding: '15px 0',
    marginTop: 6,
    cursor: 'pointer',
    border: 'none',
    boxShadow: '0 4px 14px rgba(27,135,230,0.35)',
    transition: 'opacity 0.15s ease',
  },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: 800 },
  bottomHint: {
    fontSize: 12,
    color: colors.latte,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: '18px',
  },

  spinner: {
    width: 22,
    height: 22,
    border: '3px solid rgba(255,255,255,0.35)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
