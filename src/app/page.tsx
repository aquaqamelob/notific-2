'use client';

// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
//       <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
//         <Image
//           className="dark:invert"
//           src="https://nextjs.org/icons/next.svg"
//           alt="Next.js logo"
//           width={180}
//           height={38}
//           priority
//         />
//         <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
//           <li className="mb-2">
//             Get started by editing{" "}
//             <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
//               src/app/page.tsx
//             </code>
//             .
//           </li>
//           <li>Save and see your changes instantly.</li>
//         </ol>

//         <div className="flex gap-4 items-center flex-col sm:flex-row">
//           <a
//             className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="https://nextjs.org/icons/vercel.svg"
//               alt="Vercel logomark"
//               width={20}
//               height={20}
//             />
//             Deploy now
//           </a>
//           <a
//             className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Read our docs
//           </a>
//         </div>
//       </main>
//       <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="https://nextjs.org/icons/file.svg"
//             alt="File icon"
//             width={16}
//             height={16}
//           />
//           Learn
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="https://nextjs.org/icons/window.svg"
//             alt="Window icon"
//             width={16}
//             height={16}
//           />
//           Examples
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="https://nextjs.org/icons/globe.svg"
//             alt="Globe icon"
//             width={16}
//             height={16}
//           />
//           Go to nextjs.org →
//         </a>
//       </footer>
//     </div>
//   );
// }

import { useEffect } from 'react';
import { subscribeUser, unsubscribeUser, sendNotification } from './actions';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function NotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });
    const sub = await registration.pushManager.getSubscription();
    setSubscription(sub);
  }

  async function subscribeToPush() {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    });
    setSubscription(sub);
    await subscribeUser(sub);
  }

  async function unsubscribeFromPush() {
    await subscription?.unsubscribe();
    setSubscription(null);
    await unsubscribeUser();
  }

  async function sendTestNotification() {
    if (subscription) {
      await sendNotification(message);
      setMessage('');
    }
  }

  if (!isSupported) {
    return <p>Push notifications are not supported in this browser.</p>;
  }

  return (
    <div className='text-balance'>
      <h3>Push Notifications</h3>
      {subscription ? (
        <>
          <p>You are subscribed to push notifications.</p>
          <button onClick={unsubscribeFromPush}>Unsubscribe</button>
          <input
            type='text'
            placeholder='Enter notification message'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={sendTestNotification}>Send Test</button>
        </>
      ) : (
        <>
          <p>You are not subscribed to push notifications.</p>
          <button onClick={subscribeToPush}>Subscribe</button>
        </>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Drawer } from 'vaul';

type DrawerDirection = 'bottom' | 'top' | 'left' | 'right' | undefined;

const CenteredContent = () => {
  return (
    <div className='max-w-md mx-auto'>
      <Drawer.Title className='font-medium mb-4'>
        Unstyled drawer for React.
      </Drawer.Title>
      <p className='text-zinc-600 mb-2'>
        This component can be used as a replacement for a Dialog on mobile and
        tablet devices.
      </p>
      <p className='text-zinc-600 mb-8'>
        It uses{' '}
        <a
          href='https://www.radix-ui.com/docs/primitives/components/dialog'
          className='underline'
          target='_blank'
        >
          Radix&apos;s Dialog primitive
        </a>{' '}
        under the hood and is inspired by{' '}
        <a
          href='https://twitter.com/devongovett/status/1674470185783402496'
          className='underline'
          target='_blank'
        >
          this tweet.
        </a>
      </p>
    </div>
  );
};

export default function Page() {
  const [direction, setDirection] = useState<DrawerDirection>('bottom');

  return (
    <div
      className='w-screen h-screen bg-white p-8 flex flex-col gap-2 justify-center items-center font-[family-name:var(--font-geist-sans)]'
      data-vaul-drawer-wrapper=''
    >
      <NotificationManager />
      <Drawer.Root shouldScaleBackground direction={direction}>
        <Drawer.Trigger asChild>
          <button data-testid='trigger' className='text-2xl'>
            Open Drawer
          </button>
        </Drawer.Trigger>
        <Drawer.Overlay className='fixed inset-0 bg-black/40' />
        <Drawer.Content className='bg-white flex flex-col fixed bottom-0 left-0 right-0 max-h-[82vh] rounded-t-[10px]'>
          <div className='max-w-md w-full mx-auto overflow-auto p-4 rounded-t-[10px]'>
            <Drawer.Handle />
            <Drawer.Title className='font-medium text-gray-900 mt-8'>
              New Project
            </Drawer.Title>
            <Drawer.Description className='leading-6 mt-2 text-gray-600'>
              Get started by filling in the information below to create your new
              project.
            </Drawer.Description>
            <label
              htmlFor='name'
              className='font-medium text-gray-900 text-sm mt-8 mb-2 block'
            >
              Project name
            </label>
            <input
              id='name'
              className='border border-gray-200 bg-white w-full px-3 h-9 rounded-lg outline-none focus:ring-2 focus:ring-black/5 text-gray-900'
            />
            <label
              htmlFor='name'
              className='font-medium text-gray-900 text-sm mt-8 mb-2 block'
            >
              Description
            </label>
            <textarea
              rows={6}
              className='border border-gray-200 bg-white w-full resize-none rounded-lg p-3 pt-2.5 text-gray-900 outline-none focus:ring-2 focus:ring-black/5 focus:ring-offset-0'
            />
            <button className='h-[44px] bg-black text-gray-50 rounded-lg mt-4 w-full font-medium'>
              Submit
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Root>
    </div>
  );
}
