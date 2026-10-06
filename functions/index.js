/**
 * RideMesh Cloud Functions.
 * Push delivery:
 * - Android: prefer native FCM device tokens via Admin SDK (works without Expo FCM creds)
 * - Expo push tokens: Expo Push API (needs FCM V1 key on EAS for Android Expo tokens)
 *
 * Deploy: cd functions && npm install && npx -y firebase-tools@latest deploy --only functions
 *
 * firebase-functions v6+: use the v1 namespace for classic Firestore triggers.
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

/** Maps notification `type` → NotificationPreferencesScreen pref key */
const TYPE_TO_PREF = {
  new_chat: 'directMessages',
  seat_approved: 'seatApproved',
  seat_rejected: 'seatApproved',
  seat_request_new: 'seatApproved',
  vehicle_switch_requested: 'vehicleStatus',
  info: 'systemUpdates',
};

function isSafetyType(type) {
  return type === 'safety_sos' || type === 'safety_help' || type === 'safety_stop';
}

/**
 * Safety alerts always push. Other types respect masterOn + per-type prefs.
 * Missing prefs = allow (defaults on until user saves preferences).
 */
async function shouldSendPush(userId, type) {
  if (isSafetyType(type)) return true;
  try {
    const snap = await admin.firestore().collection('users').doc(userId).get();
    const prefs = snap.data()?.notificationPrefs;
    if (!prefs) return true;
    if (prefs.masterOn === false) return false;
    const key = TYPE_TO_PREF[type];
    if (!key) return true;
    if (prefs.prefs && prefs.prefs[key] === false) return false;
    return true;
  } catch (e) {
    console.warn('shouldSendPush prefs read failed', e?.message || e);
    return true;
  }
}

function collectTokens(docs) {
  const expoTokens = new Set();
  const fcmTokens = new Set();
  for (const d of docs) {
    const data = d.data() || {};
    const expo = data.token;
    const device = data.deviceToken;
    if (typeof expo === 'string' && expo.length) {
      if (expo.startsWith('ExponentPushToken') || expo.startsWith('ExpoPushToken')) {
        expoTokens.add(expo);
      } else {
        // Legacy / mislabeled native token stored in `token`
        fcmTokens.add(expo);
      }
    }
    if (typeof device === 'string' && device.length) {
      fcmTokens.add(device);
    }
  }
  return {
    expoTokens: [...expoTokens],
    fcmTokens: [...fcmTokens],
  };
}

async function sendViaExpo(tokens, { title, body, type, channelId, data }) {
  if (!tokens.length) return null;
  const messages = tokens.map((to) => ({
    to,
    title,
    body,
    priority: 'high',
    channelId,
    data,
  }));
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  });
  const json = await res.json();
  console.log('Expo push result', JSON.stringify(json).slice(0, 1500));
  return json;
}

async function sendViaFcm(tokens, { title, body, type, channelId, data }) {
  if (!tokens.length) return null;
  // FCM data values must be strings
  const stringData = {};
  for (const [k, v] of Object.entries(data || {})) {
    stringData[k] = v == null ? '' : String(v);
  }
  const res = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: stringData,
    android: {
      priority: 'high',
      notification: {
        channelId,
        sound: 'default',
        priority: 'max',
        defaultVibrateTimings: true,
      },
    },
  });
  console.log('FCM multicast', {
    success: res.successCount,
    failure: res.failureCount,
  });
  if (res.failureCount) {
    res.responses.forEach((r, i) => {
      if (!r.success) {
        console.warn('FCM fail', tokens[i]?.slice?.(0, 12), r.error?.code, r.error?.message);
      }
    });
  }
  return res;
}

/**
 * On notification create, send push via FCM (device tokens) and/or Expo Push API.
 */
exports.sendPushOnNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap) => {
    const data = snap.data() || {};
    const userId = data.userId;
    if (!userId) return null;

    const type = data.type || '';
    const allowed = await shouldSendPush(userId, type);
    if (!allowed) {
      console.log('sendPushOnNotification skipped by prefs', { userId, type });
      return null;
    }

    const title = data.title || 'RideMesh';
    const body = data.message || '';
    const tokensSnap = await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .get();
    const { expoTokens, fcmTokens } = collectTokens(tokensSnap.docs);
    if (!expoTokens.length && !fcmTokens.length) {
      console.log('sendPushOnNotification no tokens', { userId, type });
      return null;
    }

    const isSafety = isSafetyType(type);
    const channelId = isSafety ? 'safety' : 'default';
    const payloadData = {
      type,
      rideId: data.rideId || '',
      requestId: data.requestId || '',
      threadId: data.threadId || '',
    };

    try {
      const results = {};
      // Prefer native FCM for Android device tokens (does not require Expo FCM V1 upload).
      results.fcm = await sendViaFcm(fcmTokens, {
        title,
        body,
        type,
        channelId,
        data: payloadData,
      });
      results.expo = await sendViaExpo(expoTokens, {
        title,
        body,
        type,
        channelId,
        data: payloadData,
      });
      return results;
    } catch (e) {
      console.error('sendPushOnNotification', e);
      return null;
    }
  });

// Client writes `notifications` docs when a signal is sent.
// Push is handled by sendPushOnNotification. These stay as no-ops to avoid duplicate inbox items.
exports.notifyOnSosAlert = functions.firestore
  .document('sosAlerts/{alertId}')
  .onCreate(async () => null);

exports.notifyOnHelpSignal = functions.firestore
  .document('helpSignals/{signalId}')
  .onCreate(async () => null);
