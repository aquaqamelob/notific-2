'use server';

// @ts-ignore
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

let subscription: PushSubscription | null = null;

export async function subscribeUser(sub: PushSubscription) {
  subscription = sub;

  // Encrypt and store subscription data for offline access
  const encryptedSub = await encryptData(sub);
  localStorage.setItem('encryptedSubscription', encryptedSub);

  // Optional: Store subscription in a database for a production environment
  // await db.subscriptions.create({ data: sub });

  return { success: true };
}

export async function unsubscribeUser() {
  subscription = null;

  // Remove subscription from local storage
  localStorage.removeItem('encryptedSubscription');

  // Optional: Remove subscription from database in a production environment
  // await db.subscriptions.delete({ where: { ... } });

  return { success: true };
}

// Helper function to encrypt data before storing
async function encryptData(data: any): Promise<string> {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(JSON.stringify(data));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );

  // Store key and IV with encrypted data (In production, manage keys securely)
  return JSON.stringify({
    encryptedData: Array.from(new Uint8Array(encryptedData)),
    iv: Array.from(iv),
  });
}

// Helper function to decrypt data when retrieving subscription
async function decryptData(
  encrypted: string
): Promise<PushSubscription | null> {
  const { encryptedData, iv } = JSON.parse(encrypted);
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(encryptedData)
  );

  const decoder = new TextDecoder();
  const decryptedStr = decoder.decode(decrypted);
  return JSON.parse(decryptedStr);
}

// Retrieve subscription for offline access
export async function getStoredSubscription(): Promise<PushSubscription | null> {
  const encryptedSub = localStorage.getItem('encryptedSubscription');
  if (encryptedSub) {
    return await decryptData(encryptedSub);
  }
  return null;
}

export async function sendNotification(message: string) {
  if (!(await getStoredSubscription())) {
    throw new Error('No subscription available');
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: 'Test Notification',
        body: message,
        icon: '/icon.png',
      })
    );
    return { success: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}
