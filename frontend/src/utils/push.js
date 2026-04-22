import api from '../services/api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  if (!base64String || typeof base64String !== 'string') {
    throw new Error('VAPID Public Key is missing or invalid');
  }
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(orderNumber) {
  if (!VAPID_PUBLIC_KEY) {
    console.error('VITE_VAPID_PUBLIC_KEY is missing from environment variables');
    return { success: false, error: 'Push system not configured. Please add VITE_VAPID_PUBLIC_KEY to environment variables.' };
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported');
    return { success: false, error: 'Push messaging is not supported in this browser.' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if we already have a subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    // Send subscription to backend
    const subscriptionData = subscription.toJSON();
    console.log('Sending subscription to backend:', subscriptionData);
    
    await api.post('/push-subscriptions', {
      order_number: orderNumber,
      endpoint: subscriptionData.endpoint,
      public_key: subscriptionData.keys.p256dh,
      auth_token: subscriptionData.keys.auth
    });

    console.log('Push subscription successful');
    return { success: true };
  } catch (error) {
    console.error('Push subscription failed error detail:', error);
    let errorMessage = error.message;
    if (error.response) {
      console.error('Backend responded with:', error.response.data);
      errorMessage = error.response.data.message || errorMessage;
    }
    return { success: false, error: errorMessage };
  }
}
