export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return { ok: false, msg: 'This browser does not support notifications.' };
  }

  if (Notification.permission === 'granted') {
    return { ok: true, msg: 'Notifications already enabled.' };
  }

  const result = await Notification.requestPermission();

  if (result === 'granted') {
    return { ok: true, msg: 'Notifications enabled!' };
  } else {
    return { ok: false, msg: 'Permission denied. Please allow notifications in your browser settings.' };
  }
}

export function sendNotification(title, body, items = []) {
  if (Notification.permission !== 'granted') return;

  const icon = '/icons/icon-192.png';

  // Build a readable body if items array is passed
  let fullBody = body;
  if (items.length > 0) {
    fullBody = 'Missing: ' + items.map(i => i.name || i).join(', ');
  }

  try {
    // Use Service Worker notification if available (shows even when app is closed)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body: fullBody,
        icon,
      });
    } else {
      // Fallback: direct browser notification
      new Notification(title, {
        body: fullBody,
        icon,
        badge: icon,
        vibrate: [200, 100, 200],
      });
    }
  } catch (e) {
    console.error('[Notification] Error:', e);
  }
}