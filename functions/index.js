/**
 * RideMesh Cloud Functions.
 * Push delivery uses Expo push tokens stored in `users/{uid}/fcmTokens` (legacy name).
 * Deploy: cd functions && npm install && firebase deploy --only functions
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * On notification create, send push via Expo Push API to user's Expo tokens
 * (stored under users/{uid}/fcmTokens as {token}).
 */
exports.sendPushOnNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const userId = data.userId;
    if (!userId) return null;
    const title = data.title || 'RideMesh';
    const body = data.message || '';
    const tokensSnap = await admin.firestore().collection('users').doc(userId).collection('fcmTokens').get();
    const tokens = tokensSnap.docs.map((d) => d.data().token).filter(Boolean);
    if (tokens.length === 0) return null;
    try {
      // Expo expects one message per token
      const messages = tokens.map((to) => ({
        to,
        title,
        body,
        data: { type: data.type || '', rideId: data.rideId || '' },
      }));
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      });
      const json = await res.json();
      return json;
    } catch (e) {
      console.error('sendPushOnNotification', e);
      return null;
    }
  });
